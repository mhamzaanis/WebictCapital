"""
PSX Closing Rates Parser
========================
Fetches the latest 3 trading-day PDFs from PSX and writes them to:
    public/data/psx/day1.json   <- most recent trading day
    public/data/psx/day2.json   <- one day before
    public/data/psx/day3.json   <- two days before

Files are always overwritten so the frontend always has exactly 3 slots.
Run every weekday at 6 PM PKT via GitHub Actions.
"""

import io
import json
import logging
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import pdfplumber
import requests

# -- Logging ------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)

# -- Config -------------------------------------------------------------------
OUTPUT_DIR = Path("public/data/psx")
SLOTS = ["day1.json", "day2.json", "day3.json"]
LOOKBACK_WINDOW_DAYS = 14           # scan up to 14 calendar days to find 3 trading days
PSX_PDF_URL = "https://dps.psx.com.pk/download/closing_rates/{day}.pdf"
PKT_TZ = ZoneInfo("Asia/Karachi")

# PSX PDFs repeat the header row on each page
HEADER_VARIANTS = {"symbol", "s.no", "sr#", "sr.no", "no.", "sr", "code", "scrip"}

LINE_ROW_RE = re.compile(
    r"^(?P<symbol>[A-Z0-9\-+&/.]+)\s+"
    r"(?P<company>.*?)\s+"
    r"(?P<turnover>[0-9,]+)\s+"
    r"(?P<prev>-?\d+(?:\.\d+)?)\s+"
    r"(?P<open>-?\d+(?:\.\d+)?)\s+"
    r"(?P<high>-?\d+(?:\.\d+)?)\s+"
    r"(?P<low>-?\d+(?:\.\d+)?)\s+"
    r"(?P<last>-?\d+(?:\.\d+)?)\s+"
    r"(?P<change>-?\d+(?:\.\d+)?)$"
)

SKIP_LINE_PREFIXES = (
    "Pakistan Stock Exchange Limited",
    "CLOSING RATE SUMMARY",
    "From :",
    "PageNo:",
    "Flu No:",
    "P. Vol.:",
    "C. Vol.:",
    "Total:",
    "Company Name Turnover",
)


# -- PDF helpers --------------------------------------------------------------
def _is_header_row(values: list[str]) -> bool:
    return values[0].strip().lower() in HEADER_VARIANTS


def _fetch_pdf(day_str: str) -> bytes | None:
    url = PSX_PDF_URL.format(day=day_str)
    log.info("Fetching: %s", url)
    try:
        r = requests.get(url, timeout=(10, 40))
    except requests.RequestException as exc:
        log.warning("Network error for %s: %s", day_str, exc)
        return None
    if r.status_code == 404:
        log.info("No PDF for %s (404 - likely a weekend/holiday)", day_str)
        return None
    if r.status_code != 200:
        log.warning("HTTP %d for %s", r.status_code, day_str)
        return None
    log.info("Downloaded %d bytes for %s", len(r.content), day_str)
    return r.content


def _parse_pdf(content: bytes, day_str: str) -> dict | None:
    stocks: list[dict] = []
    seen: set[tuple[str, str, str, str]] = set()

    def push_row(values: dict[str, str]) -> None:
        key = (values["symbol"], values["company"], values["last_rate"], values["change"] or "")
        if key in seen:
            return
        seen.add(key)
        stocks.append(values)

    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            log.info("Parsing %d page(s)...", len(pdf.pages))

            # Strategy 1 (primary): line parsing - currently most reliable for PSX PDFs.
            for page in pdf.pages:
                text = page.extract_text() or ""
                for raw_line in text.splitlines():
                    line = raw_line.strip()
                    if not line:
                        continue
                    if any(line.startswith(prefix) for prefix in SKIP_LINE_PREFIXES):
                        continue
                    if line.startswith("***") and line.endswith("***"):
                        continue

                    match = LINE_ROW_RE.match(line)
                    if not match:
                        continue

                    push_row({
                        "symbol": match.group("symbol").strip(),
                        "company": match.group("company").strip(),
                        "turnover": match.group("turnover").replace(",", ""),
                        "prev_rate": match.group("prev"),
                        "open": match.group("open"),
                        "high": match.group("high"),
                        "low": match.group("low"),
                        "last_rate": match.group("last"),
                        "change": match.group("change"),
                    })

            # Strategy 2 (fallback): structured table extraction.
            if not stocks:
                log.info("Line parsing returned no rows for %s; trying table extraction fallback", day_str)
                for page_num, page in enumerate(pdf.pages, 1):
                    for table in (page.extract_tables() or []):
                        if not table or len(table) < 2:
                            continue
                        for row in table:
                            if not row:
                                continue
                            values = [(cell or "").strip() for cell in row]
                            if not values[0]:
                                continue
                            if _is_header_row(values):
                                continue
                            if len(values) < 8:
                                log.debug(
                                    "Page %d: short row (%d cols), skipping: %s",
                                    page_num, len(values), values,
                                )
                                continue
                            push_row({
                                "symbol": values[0],
                                "company": values[1],
                                "turnover": values[2],
                                "prev_rate": values[3],
                                "open": values[4],
                                "high": values[5],
                                "low": values[6],
                                "last_rate": values[7],
                                "change": values[8] if len(values) > 8 else None,
                            })
    except Exception as exc:
        log.error("PDF parse failed for %s: %s", day_str, exc, exc_info=True)
        return None

    if not stocks:
        log.warning("Zero stocks parsed for %s - PDF layout may have changed", day_str)
        return None

    log.info("Parsed %d stocks for %s", len(stocks), day_str)
    return {
        "date":         day_str,
        "source":       "PDF",
        "total_stocks": len(stocks),
        "stocks":       stocks,
    }


# -- Main ---------------------------------------------------------------------
def run() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    results: list[dict] = []
    today_pkt = datetime.now(PKT_TZ).date()

    for days_back in range(LOOKBACK_WINDOW_DAYS):
        if len(results) >= 3:
            break
        candidate_day = today_pkt - timedelta(days=days_back)
        if candidate_day.weekday() >= 5:
            # Never fetch weekend URLs; PSX has no trading session on Sat/Sun.
            log.info("Skipping %s (weekend)", candidate_day.isoformat())
            continue

        day_str = candidate_day.strftime("%Y-%m-%d")
        content = _fetch_pdf(day_str)
        if content is None:
            continue
        parsed = _parse_pdf(content, day_str)
        if parsed is None:
            continue
        results.append(parsed)

    if not results:
        log.error("Could not fetch any PSX closing data in the last %d days.", LOOKBACK_WINDOW_DAYS)
        sys.exit(1)

    generated_at_utc = datetime.now(timezone.utc).isoformat(timespec="seconds")

    # Always overwrite day1/day2/day3
    for slot_name, data in zip(SLOTS, results):
        out_path = OUTPUT_DIR / slot_name
        payload = {**data, "last_updated_utc": generated_at_utc}
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        log.info(
            "Wrote %d stocks -> %s  (date: %s, updated: %s)",
            data["total_stocks"],
            out_path,
            data["date"],
            generated_at_utc,
        )

    # Remove stale slots if fewer than 3 trading days were found
    for slot_name in SLOTS[len(results):]:
        out_path = OUTPUT_DIR / slot_name
        if out_path.exists():
            out_path.unlink()
            log.info("Removed stale slot: %s", out_path)

    log.info("Done. Wrote %d slot(s).", len(results))


if __name__ == "__main__":
    run()