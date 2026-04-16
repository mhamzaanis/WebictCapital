import requests
import zipfile
import io
import pdfplumber
import json
from datetime import date
from pathlib import Path
import sys

def download_and_parse():
    today = date.today().strftime("%Y-%m-%d")
    output_dir = Path("data")
    output_dir.mkdir(parents=True, exist_ok=True)
    json_path = output_dir / f"closing-{today}.json"
    
    # 1. Try ZIP first (best)
    zip_url = f"https://dps.psx.com.pk/download/mkt_summary/{today}.Z"
    response = requests.get(zip_url)
    
    if response.status_code == 200:
        print("✅ ZIP downloaded")
        with zipfile.ZipFile(io.BytesIO(response.content)) as z:
            # PSX ZIP usually contains CSV or text files - adjust filename if needed
            for file in z.namelist():
                if file.endswith(('.csv', '.txt')):
                    data = z.read(file).decode('utf-8')
                    # Add your CSV parsing logic here (simple split or pandas)
                    print(f"Parsed ZIP file: {file}")
                    # For now we save raw for testing
                    with open(json_path, "w", encoding="utf-8") as f:
                        json.dump({"date": today, "source": "ZIP", "raw": data[:5000]}, f)  # placeholder
                    return
    
    # 2. Fallback to PDF
    pdf_url = f"https://dps.psx.com.pk/download/closing_rates/{today}.pdf"
    response = requests.get(pdf_url)
    if response.status_code != 200:
        print("No trading today or file not ready")
        sys.exit(0)
    
    print("✅ PDF downloaded (fallback)")
    with pdfplumber.open(io.BytesIO(response.content)) as pdf:
        all_stocks = []
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                if table and len(table) > 5:  # skip headers
                    for row in table[1:]:  # skip header row
                        if len(row) >= 8:
                            all_stocks.append({
                                "symbol": row[0],
                                "company": row[1],
                                "turnover": row[2],
                                "prev_rate": row[3],
                                "open": row[4],
                                "high": row[5],
                                "low": row[6],
                                "last_rate": row[7],
                                "change": row[8] if len(row) > 8 else None
                            })
        
        result = {
            "date": today,
            "indices": {"KSE100": "168519.94", "KSE30": "50918.37"},  # extract from header later
            "stocks": all_stocks,
            "total_stocks": len(all_stocks)
        }
        
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Saved {len(all_stocks)} stocks to {json_path}")

if __name__ == "__main__":
    download_and_parse()