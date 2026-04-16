"""
PSX Closing Rates Parser  —  Improved Edition
==============================================
Fixes:
  • Multi-line company names are correctly joined (e.g. "Burj Clean / Energy")
  • Market summary (open/close index, volume, advances/declines) extracted per page
  • Stocks table captures all 7 numeric columns reliably
  • Section labels (CEMENT, BANKS, …) stored per stock
  • Future contracts, bonds, defaulters included but flagged with their section
  • Output: public/data/psx/day1.json … day3.json  (same contract as before)

Run:  python psx_parser.py
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

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
OUTPUT_DIR          = Path("public/data/psx")
SLOTS               = ["day1.json", "day2.json", "day3.json"]
LOOKBACK_WINDOW_DAYS = 14
PSX_PDF_URL         = "https://dps.psx.com.pk/download/closing_rates/{day}.pdf"
PKT_TZ              = ZoneInfo("Asia/Karachi")

# ---------------------------------------------------------------------------
# Compiled regexes
# ---------------------------------------------------------------------------

# Market summary lines
_PVOL_RE  = re.compile(
    r"P\.\s*Vol\.:?\s*([\d,]+)\s+"
    r"P\.KSE100 Ind:\s*([\d.]+)\s+"
    r"P\.KSE30 Ind:\s*([\d.]+)\s+"
    r"Plus:\s*(\d+)"
)
_CVOL_RE  = re.compile(
    r"C\.\s*Vol\.:?\s*([\d,]+)\s+"
    r"C\.KSE100 Ind:\s*([\d.]+)\s+"
    r"C\.KSE30 Ind:\s*([\d.]+)\s+"
    r"Minus:\s*(\d+)"
)
_TOTAL_RE = re.compile(r"Total:\s*(\d+).*?Equal:\s*(\d+)")
_DATE_RE  = re.compile(
    r"(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)"
    r"\s+(\w+\s+\d+,\s*\d{4})"
)

# A stock data line:
#   SYMBOL  <company fragment>  TURNOVER  PREV  OPEN  HIGH  LOW  LAST  DIFF
# OPEN may be "-" for stocks with no open trade.
# DIFF may be negative.
_DATA_RE = re.compile(
    r"^([A-Z0-9][A-Z0-9\-+&/.]*)\s+"   # [1] symbol
    r"(.+?)\s+"                          # [2] company fragment (non-greedy)
    r"([\d,]+)\s+"                       # [3] turnover
    r"(-?\d+(?:\.\d+)?)\s+"             # [4] prev_rate
    r"(-|-?\d+(?:\.\d+)?)\s+"           # [5] open_rate  (or "-")
    r"(-?\d+(?:\.\d+)?)\s+"             # [6] highest
    r"(-?\d+(?:\.\d+)?)\s+"             # [7] lowest
    r"(-?\d+(?:\.\d+)?)\s+"             # [8] last_rate
    r"(-?\d+(?:\.\d+)?)$"               # [9] diff
)

# A "continuation" line is the second part of a wrapped company name:
# short, no digits anywhere, not a section header
_CONT_RE = re.compile(r"^[A-Za-z][A-Za-z0-9 .\-'&/()+]+$")

# Lines to skip unconditionally
_SKIP_STARTS = (
    "Pakistan Stock Exchange",
    "CLOSING RATE",
    "From :",
    "PageNo:",
    "Flu No:",
    "P. Vol.",
    "C. Vol.",
    "Total:",
    "Company Name",
)


def _is_section(line: str) -> bool:
    return line.startswith("***") or line.startswith("****")


def _is_skip(line: str) -> bool:
    return any(line.startswith(p) for p in _SKIP_STARTS)


# ---------------------------------------------------------------------------
# Core parser
# ---------------------------------------------------------------------------

def _parse_pdf(content: bytes, day_str: str) -> dict | None:
    """
    Parse a PSX closing-rates PDF.

    Returns a dict shaped like the original contract:
        {
          "date": "2026-04-16",
          "source": "PDF",
          "market": { ... summary fields ... },
          "total_stocks": N,
          "stocks": [ { symbol, company, section, turnover,
                        prev_rate, open_rate, highest, lowest,
                        last_rate, diff }, ... ]
        }
    """
    market: dict = {}
    stocks: list[dict] = []
    seen:   set  = set()

    all_lines: list[str] = []

    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            log.info("Parsing %d page(s) for %s …", len(pdf.pages), day_str)

            for page_num, page in enumerate(pdf.pages, 1):
                text = page.extract_text() or ""

                # ── Market summary (parse from every page header; first hit wins) ──
                if not market:
                    dm = _DATE_RE.search(text)
                    if dm:
                        market["date"]     = dm.group(2).strip()
                        market["weekday"]  = dm.group(1).strip()

                pm = _PVOL_RE.search(text)
                if pm and "prev_volume" not in market:
                    market["prev_volume"] = int(pm.group(1).replace(",", ""))
                    market["open_kse100"] = float(pm.group(2))   # previous day close = today's open reference
                    market["open_kse30"]  = float(pm.group(3))
                    market["advances"]    = int(pm.group(4))

                cm = _CVOL_RE.search(text)
                if cm and "curr_volume" not in market:
                    market["curr_volume"]  = int(cm.group(1).replace(",", ""))
                    market["close_kse100"] = float(cm.group(2))
                    market["close_kse30"]  = float(cm.group(3))
                    market["declines"]     = int(cm.group(4))

                tm = _TOTAL_RE.search(text)
                if tm and "total_traded" not in market:
                    market["total_traded"] = int(tm.group(1))
                    market["unchanged"]    = int(tm.group(2))

                for line in text.splitlines():
                    all_lines.append(line.strip())

    except Exception as exc:
        log.error("PDF parse failed for %s: %s", day_str, exc, exc_info=True)
        return None

    # Compute derived market fields
    if "open_kse100" in market and "close_kse100" in market:
        market["kse100_change"] = round(
            market["close_kse100"] - market["open_kse100"], 2
        )
        market["kse30_change"]  = round(
            market["close_kse30"]  - market["open_kse30"],  2
        )

    # ── Stock rows – state machine over all_lines ──
    current_section = ""
    i = 0

    while i < len(all_lines):
        line = all_lines[i]

        if not line:
            i += 1
            continue

        if _is_skip(line):
            i += 1
            continue

        if _is_section(line):
            current_section = line.strip("* ").strip()
            i += 1
            continue

        m = _DATA_RE.match(line)
        if m:
            symbol   = m.group(1)
            company  = m.group(2).strip()
            turnover = int(m.group(3).replace(",", ""))
            prev_rate = float(m.group(4))
            open_rate = None if m.group(5) == "-" else float(m.group(5))
            highest   = float(m.group(6))
            lowest    = float(m.group(7))
            last_rate = float(m.group(8))
            diff      = float(m.group(9))

            # Peek: is next line a continuation of the company name?
            if i + 1 < len(all_lines):
                nxt = all_lines[i + 1]
                if (
                    nxt
                    and _CONT_RE.match(nxt)
                    and not _DATA_RE.match(nxt)
                    and not _is_section(nxt)
                    and not _is_skip(nxt)
                ):
                    company = company + " " + nxt
                    i += 1  # consume continuation line

            record = {
                "symbol":    symbol,
                "company":   company,
                "section":   current_section,
                "turnover":  turnover,
                "prev_rate": prev_rate,
                "open_rate": open_rate,
                "highest":   highest,
                "lowest":    lowest,
                "last_rate": last_rate,
                "diff":      diff,
            }

            # Deduplicate on (symbol, last_rate)
            key = (symbol, last_rate)
            if key not in seen:
                seen.add(key)
                stocks.append(record)

        i += 1

    if not stocks:
        log.warning("Zero stocks parsed for %s – PDF layout may have changed", day_str)
        return None

    log.info("Parsed %d stocks for %s", len(stocks), day_str)

    return {
        "date":         day_str,
        "source":       "PDF",
        "market":       market,
        "total_stocks": len(stocks),
        "stocks":       stocks,
    }


# ---------------------------------------------------------------------------
# Network helpers
# ---------------------------------------------------------------------------

def _fetch_pdf(day_str: str) -> bytes | None:
    url = PSX_PDF_URL.format(day=day_str)
    log.info("Fetching: %s", url)
    try:
        r = requests.get(url, timeout=(10, 40))
    except requests.RequestException as exc:
        log.warning("Network error for %s: %s", day_str, exc)
        return None
    if r.status_code == 404:
        log.info("No PDF for %s (404 – weekend/holiday)", day_str)
        return None
    if r.status_code != 200:
        log.warning("HTTP %d for %s", r.status_code, day_str)
        return None
    log.info("Downloaded %d bytes for %s", len(r.content), day_str)
    return r.content


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def run() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    results: list[dict] = []
    today_pkt = datetime.now(PKT_TZ).date()

    for days_back in range(LOOKBACK_WINDOW_DAYS):
        if len(results) >= 3:
            break
        candidate = today_pkt - timedelta(days=days_back)
        if candidate.weekday() >= 5:
            log.info("Skipping %s (weekend)", candidate.isoformat())
            continue

        day_str = candidate.strftime("%Y-%m-%d")
        content = _fetch_pdf(day_str)
        if content is None:
            continue
        parsed = _parse_pdf(content, day_str)
        if parsed is None:
            continue
        results.append(parsed)

    if not results:
        log.error(
            "Could not fetch any PSX closing data in the last %d days.",
            LOOKBACK_WINDOW_DAYS,
        )
        sys.exit(1)

    generated_at = datetime.now(timezone.utc).isoformat(timespec="seconds")

    for slot_name, data in zip(SLOTS, results):
        out_path = OUTPUT_DIR / slot_name
        payload  = {**data, "last_updated_utc": generated_at}
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        log.info(
            "Wrote %d stocks → %s  (date: %s)",
            data["total_stocks"], out_path, data["date"],
        )

    # Remove stale slots if fewer than 3 trading days found
    for slot_name in SLOTS[len(results):]:
        out_path = OUTPUT_DIR / slot_name
        if out_path.exists():
            out_path.unlink()
            log.info("Removed stale slot: %s", out_path)

    log.info("Done. Wrote %d slot(s).", len(results))


# ---------------------------------------------------------------------------
# Quick smoke-test against the uploaded sample PDF
# ---------------------------------------------------------------------------

def smoke_test(pdf_path: str) -> None:
    """Parse a local PDF file and print a summary to stdout."""
    log.info("Smoke-test: parsing %s", pdf_path)
    with open(pdf_path, "rb") as f:
        content = f.read()

    result = _parse_pdf(content, "sample")
    if result is None:
        log.error("Parse returned None")
        return

    m = result["market"]
    print("\n" + "=" * 60)
    print("MARKET SUMMARY")
    print("=" * 60)
    print(f"  Date           : {m.get('weekday','')} {m.get('date','')}")
    print(f"  Prev Volume    : {m.get('prev_volume', 'N/A'):,}")
    print(f"  Curr Volume    : {m.get('curr_volume', 'N/A'):,}")
    print(f"  Open  KSE-100  : {m.get('open_kse100','N/A')}")
    print(f"  Close KSE-100  : {m.get('close_kse100','N/A')}")
    print(f"  KSE-100 Change : {m.get('kse100_change','N/A'):+}")
    print(f"  Open  KSE-30   : {m.get('open_kse30','N/A')}")
    print(f"  Close KSE-30   : {m.get('close_kse30','N/A')}")
    print(f"  KSE-30  Change : {m.get('kse30_change','N/A'):+}")
    print(f"  Advances       : {m.get('advances','N/A')}")
    print(f"  Declines       : {m.get('declines','N/A')}")
    print(f"  Unchanged      : {m.get('unchanged','N/A')}")
    print(f"  Total traded   : {m.get('total_traded','N/A')}")

    print(f"\nTOTAL STOCKS PARSED : {result['total_stocks']}")

    # Spot-check a few stocks
    print("\nFIRST 5 STOCKS:")
    header = f"{'Symbol':<14} {'Company':<30} {'Section':<30} {'Turnover':>12} {'Prev':>8} {'Open':>8} {'High':>8} {'Low':>8} {'Last':>8} {'Diff':>7}"
    print(header)
    print("-" * len(header))
    for s in result["stocks"][:5]:
        print(
            f"{s['symbol']:<14} {s['company'][:28]:<30} {s['section'][:28]:<30} "
            f"{s['turnover']:>12,} {s['prev_rate']:>8} {str(s['open_rate'] or '-'):>8} "
            f"{s['highest']:>8} {s['lowest']:>8} {s['last_rate']:>8} {s['diff']:>+7}"
        )

    print("\nLAST 5 STOCKS:")
    print(header)
    print("-" * len(header))
    for s in result["stocks"][-5:]:
        print(
            f"{s['symbol']:<14} {s['company'][:28]:<30} {s['section'][:28]:<30} "
            f"{s['turnover']:>12,} {s['prev_rate']:>8} {str(s['open_rate'] or '-'):>8} "
            f"{s['highest']:>8} {s['lowest']:>8} {s['last_rate']:>8} {s['diff']:>+7}"
        )

    # Section breakdown
    from collections import Counter
    sections = Counter(s["section"] for s in result["stocks"])
    print("\nSTOCKS BY SECTION (top 20):")
    for sec, cnt in sections.most_common(20):
        print(f"  {cnt:>4}  {sec}")


if __name__ == "__main__":
    if len(sys.argv) == 2 and sys.argv[1].endswith(".pdf"):
        smoke_test(sys.argv[1])
    else:
        run()