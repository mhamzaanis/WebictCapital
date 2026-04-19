"""
PSX Closing Rates Parser and Supabase Uploader
==============================================
Downloads PSX daily closing-rate PDF files, parses market summary and ticker
rows, then stores them into Supabase tables:
  - market_daily_summary
  - datatable

Required env vars:
  SUPABASE_URL
  SUPABASE_SERVICE_KEY

Optional env vars:
  START_DATE           (default: 2018-01-01)
  MAX_RETRIES          (default: 3)
  RETRY_DELAY          (default: 10)
  REQUEST_DELAY        (default: 1.5)
  BATCH_SIZE           (default: 200)
  MAX_DAYS_PER_RUN     (default: 0, meaning no cap)
  FAIL_ON_EMPTY_RUN    (default: 1)
  PDF_URL_TEMPLATES    (comma-separated URL templates)

Examples:
  python src/scripts/parse_psx.py
  python src/scripts/parse_psx.py /path/to/sample.pdf
"""

from __future__ import annotations

import io
import logging
import os
import re
import sys
import time
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

import pdfplumber
import requests
from postgrest.exceptions import APIError
from supabase import Client, create_client

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SUPABASE_URL: str = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY: str = os.environ["SUPABASE_SERVICE_KEY"]

TABLE_NAME = "datatable"
SUMMARY_TABLE_NAME = "market_daily_summary"
START_DATE = date.fromisoformat(os.getenv("START_DATE", "2018-01-01"))
PKT_TZ = ZoneInfo("Asia/Karachi")

MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))
RETRY_DELAY = float(os.getenv("RETRY_DELAY", "10"))
REQUEST_DELAY = float(os.getenv("REQUEST_DELAY", "1.5"))
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "200"))
MAX_DAYS_PER_RUN = int(os.getenv("MAX_DAYS_PER_RUN", "0"))  # 0 = no cap

_DEFAULT_PDF_URL_TEMPLATES = (
    "https://dps.psx.com.pk/download/closing_rates/{day_iso}.pdf,"
    "https://dps.psx.com.pk/download/closing_rates/{day_str}.pdf"
)
PDF_URL_TEMPLATES = [
    t.strip()
    for t in os.getenv("PDF_URL_TEMPLATES", _DEFAULT_PDF_URL_TEMPLATES).split(",")
    if t.strip()
]

FAIL_ON_EMPTY_RUN = os.getenv("FAIL_ON_EMPTY_RUN", "1").strip().lower() not in {
    "0",
    "false",
    "no",
}

# Skip futures/bonds/defaulters in datatable ingestion.
SKIP_SECTION_KEYWORDS = {
    "FUTURE CONTRACTS",
    "STOCK INDEX FUTURE",
    "BONDS",
    "DEFAULTER",
    "TWF",
}

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)


class FatalConfigError(RuntimeError):
    """Non-retryable setup/configuration error."""


def _is_missing_table_error(exc: Exception) -> bool:
    msg = str(exc)
    return "PGRST205" in msg and (TABLE_NAME in msg or SUMMARY_TABLE_NAME in msg)


# ---------------------------------------------------------------------------
# Supabase helpers
# ---------------------------------------------------------------------------

def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def get_last_stored_date(sb: Client) -> date | None:
    """Return most recent trade_date in market_daily_summary, or None."""
    try:
        res = (
            sb.table(SUMMARY_TABLE_NAME)
            .select("trade_date")
            .order("trade_date", desc=True)
            .limit(1)
            .execute()
        )
    except APIError as exc:
        if _is_missing_table_error(exc):
            raise FatalConfigError(
                f"Supabase table '{SUMMARY_TABLE_NAME}' was not found. "
                "Run the schema SQL first and retry."
            ) from exc
        raise

    if res.data:
        return date.fromisoformat(str(res.data[0]["trade_date"])[:10])
    return None


def upsert_summary(sb: Client, summary: dict) -> None:
    """Insert or update one market_daily_summary row by trade_date."""
    try:
        sb.table(SUMMARY_TABLE_NAME).upsert(summary, on_conflict="trade_date").execute()
    except APIError as exc:
        if _is_missing_table_error(exc):
            raise FatalConfigError(
                f"Supabase table '{SUMMARY_TABLE_NAME}' was not found."
            ) from exc
        raise


def replace_rows_for_date(sb: Client, trade_date_str: str, rows: list[dict]) -> None:
    """
    Replace datatable rows for a trade_date.

    Current schema does not define a unique key on (trade_date, symbol), so this
    uses delete+insert semantics instead of upsert to avoid duplicate growth.
    """
    try:
        sb.table(TABLE_NAME).delete().eq("trade_date", trade_date_str).execute()
    except APIError as exc:
        if _is_missing_table_error(exc):
            raise FatalConfigError(f"Supabase table '{TABLE_NAME}' was not found.") from exc
        raise

    if not rows:
        return

    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        try:
            sb.table(TABLE_NAME).insert(batch).execute()
        except APIError as exc:
            if _is_missing_table_error(exc):
                raise FatalConfigError(
                    f"Supabase table '{TABLE_NAME}' was not found."
                ) from exc
            raise


# ---------------------------------------------------------------------------
# PDF download helpers
# ---------------------------------------------------------------------------

def day_str(d: date) -> str:
    """Format date as DDMMMYYYY, e.g. 16APR2026."""
    return d.strftime("%d%b%Y").upper()


def day_iso(d: date) -> str:
    """Format date as YYYY-MM-DD."""
    return d.isoformat()


def download_pdf(d: date) -> bytes | None:
    """
    Download the closing-rate PDF for date d.
    Returns PDF bytes on success, otherwise None.
    """
    urls = [
        template.format(day_str=day_str(d), day_iso=day_iso(d))
        for template in PDF_URL_TEMPLATES
    ]

    for url in urls:
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                resp = requests.get(url, timeout=30)
                if resp.status_code == 404:
                    break
                if resp.status_code == 200:
                    content_type = resp.headers.get("Content-Type", "")
                    if resp.content[:4] == b"%PDF" or "pdf" in content_type.lower():
                        return resp.content
                    log.warning("  %s -> 200 but non-PDF from %s", d, url)
                    break
                log.warning(
                    "  %s -> HTTP %d from %s (attempt %d/%d)",
                    d,
                    resp.status_code,
                    url,
                    attempt,
                    MAX_RETRIES,
                )
            except requests.RequestException as exc:
                log.warning(
                    "  %s -> network error from %s (attempt %d/%d): %s",
                    d,
                    url,
                    attempt,
                    MAX_RETRIES,
                    exc,
                )
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY)

    log.info("  %s -> PDF not found, skipping", d)
    return None


# ---------------------------------------------------------------------------
# PDF parsing
# ---------------------------------------------------------------------------

_ROW_RE = re.compile(
    r"^([A-Z][A-Z0-9]*)\s+"  # ticker
    r"(.+?)\s+"  # company
    r"([\d,]+)\s+"  # turnover
    r"([\d.]+|-)\s+"  # prev
    r"([\d.]+|-)\s+"  # open
    r"([\d.]+|-)\s+"  # high
    r"([\d.]+|-)\s+"  # low
    r"([\d.]+|-)\s+"  # close
    r"(-?[\d.]+)$"  # change
)

_SECTION_RE = re.compile(r"\*{3}\s*(.+?)\s*\*{3}")

_PVOL_RE = re.compile(r"P\.\s*Vol\.:\s*([\d,]+)")
_CVOL_RE = re.compile(r"C\.\s*Vol\.:\s*([\d,]+)")
_PKSE100_RE = re.compile(r"P\.KSE100\s+Ind:\s*([\d.]+)")
_CKSE100_RE = re.compile(r"C\.KSE100\s+Ind:\s*([\d.]+)")
_PKSE30_RE = re.compile(r"P\.KSE\s*30\s+Ind:\s*([\d.]+)")
_CKSE30_RE = re.compile(r"C\.KSE\s*30\s+Ind:\s*([\d.]+)")
_PLUS_RE = re.compile(r"Plus\s*:\s*(\d+)")
_MINUS_RE = re.compile(r"Minus\s*:\s*(\d+)")
_EQUAL_RE = re.compile(r"Equal\s*:\s*(\d+)")
_FLUNO_RE = re.compile(r"Flu\s+No[:\s]+([\w/]+)")


def _to_float(s: str | None) -> float | None:
    if not s or s == "-":
        return None
    try:
        return float(s.replace(",", ""))
    except ValueError:
        return None


def _to_int(s: str | None) -> int | None:
    if not s or s == "-":
        return None
    try:
        return int(s.replace(",", ""))
    except ValueError:
        return None


def _extract_header(full_text: str) -> dict:
    def _find(pattern: re.Pattern[str]) -> str | None:
        m = pattern.search(full_text)
        return m.group(1).replace(",", "") if m else None

    kse100_prev = _to_float(_find(_PKSE100_RE))
    kse100_close = _to_float(_find(_CKSE100_RE))
    kse30_prev = _to_float(_find(_PKSE30_RE))
    kse30_close = _to_float(_find(_CKSE30_RE))

    return {
        "prev_volume": _to_int(_find(_PVOL_RE)),
        "curr_volume": _to_int(_find(_CVOL_RE)),
        "kse100_prev": kse100_prev,
        "kse100_close": kse100_close,
        "kse100_change": round((kse100_close or 0) - (kse100_prev or 0), 2),
        "kse30_prev": kse30_prev,
        "kse30_close": kse30_close,
        "kse30_change": round((kse30_close or 0) - (kse30_prev or 0), 2),
        "advances": _to_int(_find(_PLUS_RE)),
        "declines": _to_int(_find(_MINUS_RE)),
        "unchanged": _to_int(_find(_EQUAL_RE)),
        "flu_no": _find(_FLUNO_RE),
    }


def parse_pdf(pdf_bytes: bytes, trade_date: date) -> tuple[dict, list[dict]]:
    """
    Parse PDF and return:
      - summary row for market_daily_summary
      - ticker rows for datatable
    """
    rows: list[dict] = []
    current_section = "UNKNOWN"
    skip_section = False
    first_page_text = ""

    trade_date_str = trade_date.isoformat()

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page_idx, page in enumerate(pdf.pages):
            text = page.extract_text(x_tolerance=3, y_tolerance=3) or ""

            if page_idx == 0:
                first_page_text = text

            for raw_line in text.splitlines():
                line = raw_line.strip()
                if not line:
                    continue

                section_match = _SECTION_RE.search(line)
                if section_match:
                    current_section = section_match.group(1).strip().upper()
                    skip_section = any(
                        keyword in current_section for keyword in SKIP_SECTION_KEYWORDS
                    )
                    continue

                if skip_section:
                    continue

                row_match = _ROW_RE.match(line)
                if not row_match:
                    continue

                (
                    symbol,
                    company,
                    turnover,
                    _prev,
                    open_rate,
                    high,
                    low,
                    close,
                    change,
                ) = row_match.groups()

                rows.append(
                    {
                        "trade_date": trade_date_str,
                        "symbol": symbol,
                        "company": company.strip(),
                        "open": _to_float(open_rate),
                        "high": _to_float(high),
                        "low": _to_float(low),
                        "close": _to_float(close),
                        "turnover": _to_int(turnover),
                        "change": _to_float(change),
                        "section": current_section,
                    }
                )

    summary = _extract_header(first_page_text)
    summary["trade_date"] = trade_date_str
    return summary, rows


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    today = datetime.now(PKT_TZ).date()
    sb = get_supabase()

    last_stored = get_last_stored_date(sb)
    if last_stored:
        fetch_from = last_stored + timedelta(days=1)
        log.info("Resuming from %s (last stored date: %s)", fetch_from, last_stored)
    else:
        fetch_from = START_DATE
        log.info("No existing data. Fetching from %s", fetch_from)

    if fetch_from > today:
        log.info("Already up to date.")
        return

    end_date = today
    if MAX_DAYS_PER_RUN > 0:
        capped_end = fetch_from + timedelta(days=MAX_DAYS_PER_RUN - 1)
        end_date = min(today, capped_end)

    log.info("Processing range %s -> %s", fetch_from, end_date)

    trading_days = 0
    skipped_days = 0
    total_rows_written = 0

    current = fetch_from
    while current <= end_date:
        log.info("-- %s", current)

        if current.weekday() >= 5:
            log.info("  %s -> weekend, skipping", current)
            skipped_days += 1
            current += timedelta(days=1)
            continue

        pdf_bytes = download_pdf(current)
        if pdf_bytes is None:
            skipped_days += 1
            current += timedelta(days=1)
            continue

        summary, rows = parse_pdf(pdf_bytes, current)
        log.info("  Parsed %d ticker rows", len(rows))

        upsert_summary(sb, summary)
        replace_rows_for_date(sb, current.isoformat(), rows)

        total_rows_written += len(rows)
        trading_days += 1
        current += timedelta(days=1)
        time.sleep(REQUEST_DELAY)

    log.info(
        "Done. %d trading days stored, %d non-trading days skipped, %d rows written.",
        trading_days,
        skipped_days,
        total_rows_written,
    )

    if FAIL_ON_EMPTY_RUN and total_rows_written == 0:
        raise RuntimeError(
            "No rows were written in this run. Most common cause: current "
            "PDF_URL_TEMPLATES does not match PSX endpoint or no new trading day exists."
        )

    if end_date < today:
        log.info(
            "Stopped at %s due to MAX_DAYS_PER_RUN=%d. Remaining dates will be processed next run.",
            end_date,
            MAX_DAYS_PER_RUN,
        )


# ---------------------------------------------------------------------------
# Optional smoke test
# ---------------------------------------------------------------------------

def smoke_test(pdf_path: str) -> None:
    """Parse a local PDF and print a quick summary."""
    with open(pdf_path, "rb") as fh:
        content = fh.read()

    summary, rows = parse_pdf(content, date.today())
    print("Summary:")
    print(summary)
    print(f"Rows parsed: {len(rows)}")


if __name__ == "__main__":
    try:
        if len(sys.argv) == 2 and sys.argv[1].lower().endswith(".pdf"):
            smoke_test(sys.argv[1])
        else:
            main()
    except FatalConfigError as exc:
        log.error("%s", exc)
        sys.exit(2)
