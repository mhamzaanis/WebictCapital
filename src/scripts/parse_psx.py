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

import hashlib
import io
import json
import logging
import os
import re
import sys
import time
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

import pdfplumber
from curl_cffi import requests
from postgrest.exceptions import APIError
from supabase import Client, create_client

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SUPABASE_URL: str = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY: str = os.environ["SUPABASE_SERVICE_KEY"]

TABLE_NAME = "datatable"
SUMMARY_TABLE_NAME = "market_daily_summary"
AI_SUMMARY_TABLE_NAME = "market_ai_summaries"
START_DATE = date.fromisoformat(os.getenv("START_DATE", "2018-01-01"))
PKT_TZ = ZoneInfo("Asia/Karachi")

MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))
RETRY_DELAY = float(os.getenv("RETRY_DELAY", "10"))
REQUEST_DELAY = float(os.getenv("REQUEST_DELAY", "1.5"))
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "200"))
MAX_DAYS_PER_RUN = int(os.getenv("MAX_DAYS_PER_RUN", "0"))  # 0 = no cap

# AI daily market brief configuration.
# Alpha Vantage is useful for market-data enrichment, but it is not a text-generation model.
# For a true AI-written brief, set these LLM_* variables for any OpenAI-compatible chat API.
AI_SUMMARY_ENABLED = os.getenv("AI_SUMMARY_ENABLED", "1").strip().lower() not in {
    "0",
    "false",
    "no",
}
AI_SUMMARY_TYPE = os.getenv("AI_SUMMARY_TYPE", "daily_market_close")
AI_PROMPT_VERSION = os.getenv("AI_PROMPT_VERSION", "v1")
LLM_API_KEY = os.getenv("LLM_API_KEY")
LLM_API_URL = os.getenv("LLM_API_URL")
LLM_MODEL = os.getenv("LLM_MODEL")
LLM_TIMEOUT = int(os.getenv("LLM_TIMEOUT", "60"))

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
    return "PGRST205" in msg and (TABLE_NAME in msg or SUMMARY_TABLE_NAME in msg or AI_SUMMARY_TABLE_NAME in msg)


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
# AI market summary helpers
# ---------------------------------------------------------------------------

def _safe_change_pct(close_value: float | None, change_value: float | None) -> float | None:
    """
    DPS gives close and absolute change. Previous close can be inferred as close - change.
    Returns percentage move vs inferred previous close.
    """
    if close_value is None or change_value is None:
        return None
    prev_close = close_value - change_value
    if prev_close == 0:
        return None
    return round((change_value / prev_close) * 100, 2)


def _round_or_none(value: float | None, digits: int = 2) -> float | None:
    if value is None:
        return None
    return round(float(value), digits)


def _compact_stock_row(row: dict) -> dict:
    change_pct = _safe_change_pct(row.get("close"), row.get("change"))
    return {
        "symbol": row.get("symbol"),
        "company": row.get("company"),
        "section": row.get("section"),
        "close": _round_or_none(row.get("close")),
        "change": _round_or_none(row.get("change")),
        "change_pct": change_pct,
        "turnover": row.get("turnover"),
    }


def build_ai_input(summary: dict, rows: list[dict]) -> dict:
    """Build a compact JSON payload for the LLM. Do not send the full PDF/table."""
    enriched_rows = []
    for row in rows:
        compact = _compact_stock_row(row)
        if compact["change_pct"] is not None:
            enriched_rows.append(compact)

    top_gainers = sorted(
        enriched_rows,
        key=lambda x: (x["change_pct"] is not None, x["change_pct"]),
        reverse=True,
    )[:10]

    top_losers = sorted(
        enriched_rows,
        key=lambda x: (x["change_pct"] is None, x["change_pct"] if x["change_pct"] is not None else 0),
    )[:10]

    volume_leaders = sorted(
        [_compact_stock_row(row) for row in rows],
        key=lambda x: x.get("turnover") or 0,
        reverse=True,
    )[:10]

    section_map: dict[str, dict] = {}
    for row in rows:
        section = row.get("section") or "UNKNOWN"
        section_map.setdefault(
            section,
            {
                "section": section,
                "symbols_count": 0,
                "total_turnover": 0,
                "advancers": 0,
                "decliners": 0,
                "unchanged": 0,
                "change_pct_values": [],
            },
        )
        item = section_map[section]
        item["symbols_count"] += 1
        item["total_turnover"] += row.get("turnover") or 0
        change_value = row.get("change")
        if change_value is not None:
            if change_value > 0:
                item["advancers"] += 1
            elif change_value < 0:
                item["decliners"] += 1
            else:
                item["unchanged"] += 1
        change_pct = _safe_change_pct(row.get("close"), row.get("change"))
        if change_pct is not None:
            item["change_pct_values"].append(change_pct)

    section_activity = []
    for item in section_map.values():
        values = item.pop("change_pct_values")
        item["avg_change_pct"] = round(sum(values) / len(values), 2) if values else None
        section_activity.append(item)

    section_activity = sorted(
        section_activity,
        key=lambda x: x.get("total_turnover") or 0,
        reverse=True,
    )[:10]

    kse100_prev = summary.get("kse100_prev")
    kse100_change = summary.get("kse100_change")
    kse30_prev = summary.get("kse30_prev")
    kse30_change = summary.get("kse30_change")

    market_summary = {
        **summary,
        "kse100_change_pct": round((kse100_change / kse100_prev) * 100, 2)
        if kse100_prev and kse100_change is not None
        else None,
        "kse30_change_pct": round((kse30_change / kse30_prev) * 100, 2)
        if kse30_prev and kse30_change is not None
        else None,
        "symbols_count": len(rows),
        "total_turnover_from_rows": sum((row.get("turnover") or 0) for row in rows),
    }

    return {
        "market_summary": market_summary,
        "top_gainers": top_gainers,
        "top_losers": top_losers,
        "volume_leaders": volume_leaders,
        "section_activity": section_activity,
    }


def compute_input_hash(ai_input: dict) -> str:
    payload = json.dumps(ai_input, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _fmt_number(value: float | int | None, digits: int = 2, signed: bool = False) -> str:
    if value is None:
        return "N/A"
    sign = "+" if signed else ""
    return f"{value:{sign},.{digits}f}"


def _fmt_int(value: int | None) -> str:
    if value is None:
        return "N/A"
    return f"{value:,}"


def build_rule_based_summary(ai_input: dict) -> tuple[str, list[str]]:
    """Safe fallback summary when no LLM key is configured or the LLM call fails."""
    m = ai_input["market_summary"]
    trade_date = m.get("trade_date")

    kse100_change = m.get("kse100_change")
    kse100_close = m.get("kse100_close")
    kse100_pct = m.get("kse100_change_pct")
    advances = m.get("advances")
    declines = m.get("declines")
    unchanged = m.get("unchanged")
    curr_volume = m.get("curr_volume")

    direction = "higher" if (kse100_change or 0) > 0 else "lower" if (kse100_change or 0) < 0 else "flat"
    breadth = "positive" if (advances or 0) > (declines or 0) else "negative" if (declines or 0) > (advances or 0) else "mixed"

    top_gainers = ai_input.get("top_gainers") or []
    top_losers = ai_input.get("top_losers") or []
    volume_leaders = ai_input.get("volume_leaders") or []

    gainer_symbols = ", ".join(x["symbol"] for x in top_gainers[:3] if x.get("symbol")) or "N/A"
    loser_symbols = ", ".join(x["symbol"] for x in top_losers[:3] if x.get("symbol")) or "N/A"
    volume_symbols = ", ".join(x["symbol"] for x in volume_leaders[:3] if x.get("symbol")) or "N/A"

    overview = (
        f"The PSX session for {trade_date} closed {direction}, with the KSE-100 ending at "
        f"{_fmt_number(kse100_close)} after a move of {_fmt_number(kse100_change)} points"
        f" ({_fmt_number(kse100_pct, signed=True)}%). Market breadth was {breadth}, with "
        f"{advances or 0} advances, {declines or 0} declines, and {unchanged or 0} unchanged stocks."
    )

    volume_sentence = (
        f"Reported current volume stood at {_fmt_int(curr_volume)} shares, with activity led by "
        f"{volume_symbols}."
        if curr_volume is not None
        else f"Trading activity was led by {volume_symbols}."
    )

    key_points = [
        f"KSE-100 closed {direction} by {_fmt_number(kse100_change)} points ({_fmt_number(kse100_pct, signed=True)}%).",
        f"Breadth was {breadth}: {advances or 0} advancers versus {declines or 0} decliners.",
        f"Top percentage gainers included {gainer_symbols}.",
        f"Top percentage losers included {loser_symbols}.",
        f"Volume leadership came from {volume_symbols}.",
    ]

    summary = (
        f"{overview}\n\n"
        f"{volume_sentence}\n\n"
        "Key points:\n"
        + "\n".join(f"- {point}" for point in key_points)
        + "\n\nWhat to watch next:\n"
        "Watch whether index movement is supported by broad participation and whether volume remains concentrated in the same leading names in the next session."
    )
    return summary, key_points


LLM_SYSTEM_PROMPT = """You are writing a daily Pakistan Stock Exchange market summary for Webict Capital.

Use only the supplied data.
Do not invent causes, news, rumors, policy reasons, macro explanations, or investor intent.
Do not give investment advice.
Do not recommend buying or selling.

Write:
1. A 2-3 sentence market overview.
2. 4-5 concise bullet points.
3. A short "What to watch next" section based only on price, volume, breadth, and index behavior.

Tone: professional, clear, research-style, suitable for retail investors.
"""


def call_llm_summary(ai_input: dict) -> str | None:
    """
    Calls any OpenAI-compatible chat-completions API.

    Required env vars:
      LLM_API_KEY
      LLM_API_URL
      LLM_MODEL
    """
    if not (LLM_API_KEY and LLM_API_URL and LLM_MODEL):
        return None

    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": LLM_SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(ai_input, ensure_ascii=False, default=str)},
        ],
        "temperature": 0.2,
    }

    headers = {
        "Authorization": f"Bearer {LLM_API_KEY}",
        "Content-Type": "application/json",
    }

    resp = requests.post(LLM_API_URL, headers=headers, json=payload, timeout=LLM_TIMEOUT)
    resp.raise_for_status()
    data = resp.json()

    # Standard OpenAI-compatible response shape.
    return data["choices"][0]["message"]["content"].strip()


def get_existing_ai_summary_hash(sb: Client, trade_date_str: str) -> str | None:
    try:
        res = (
            sb.table(AI_SUMMARY_TABLE_NAME)
            .select("input_hash")
            .eq("trade_date", trade_date_str)
            .eq("summary_type", AI_SUMMARY_TYPE)
            .limit(1)
            .execute()
        )
    except APIError as exc:
        if _is_missing_table_error(exc):
            raise FatalConfigError(
                f"Supabase table '{AI_SUMMARY_TABLE_NAME}' was not found. "
                "Run the market_ai_summaries schema SQL first and retry."
            ) from exc
        raise

    if res.data:
        return res.data[0].get("input_hash")
    return None


def upsert_ai_summary(sb: Client, payload: dict) -> None:
    try:
        sb.table(AI_SUMMARY_TABLE_NAME).upsert(
            payload,
            on_conflict="trade_date,summary_type",
        ).execute()
    except APIError as exc:
        if _is_missing_table_error(exc):
            raise FatalConfigError(f"Supabase table '{AI_SUMMARY_TABLE_NAME}' was not found.") from exc
        raise


def generate_and_store_ai_summary(sb: Client, summary: dict, rows: list[dict]) -> None:
    if not AI_SUMMARY_ENABLED:
        log.info("  AI summary disabled.")
        return

    trade_date_str = str(summary["trade_date"])
    ai_input = build_ai_input(summary, rows)
    input_hash = compute_input_hash(ai_input)

    existing_hash = get_existing_ai_summary_hash(sb, trade_date_str)
    if existing_hash == input_hash:
        log.info("  AI summary already exists and input hash is unchanged.")
        return

    fallback_summary, key_points = build_rule_based_summary(ai_input)
    summary_text = fallback_summary
    model_name = "rule_based_v1"
    error_message = None

    try:
        llm_summary = call_llm_summary(ai_input)
        if llm_summary:
            summary_text = llm_summary
            model_name = LLM_MODEL or model_name
    except Exception as exc:  # Keep the market-data job alive even if AI fails.
        error_message = f"LLM failed; stored rule-based fallback: {exc}"
        log.warning("  %s", error_message)

    payload = {
        "trade_date": trade_date_str,
        "summary_type": AI_SUMMARY_TYPE,
        "model_name": model_name,
        "prompt_version": AI_PROMPT_VERSION,
        "input_hash": input_hash,
        "summary": summary_text,
        "key_points": key_points,
        "top_gainers": ai_input.get("top_gainers"),
        "top_losers": ai_input.get("top_losers"),
        "volume_leaders": ai_input.get("volume_leaders"),
        "sector_activity": ai_input.get("section_activity"),
        "status": "completed",
        "error_message": error_message,
    }
    upsert_ai_summary(sb, payload)
    log.info("  AI market summary stored using %s", model_name)


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

    # Standard headers to look like a normal user clicking a link
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/pdf,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://dps.psx.com.pk/",
        "Connection": "keep-alive",
    }

    for url in urls:
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                # We added headers=headers and impersonate="chrome"
                resp = requests.get(url, headers=headers, impersonate="chrome120", timeout=30)
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
        generate_and_store_ai_summary(sb, summary, rows)

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