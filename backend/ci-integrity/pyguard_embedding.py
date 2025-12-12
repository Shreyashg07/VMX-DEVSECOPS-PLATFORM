import os
import json
import pickle
import sys
from datetime import datetime
from sentence_transformers import SentenceTransformer
import numpy as np

# ✅ Fix Windows encoding issue for special characters like "→"
sys.stdout.reconfigure(encoding='utf-8')

from utils.file_reader import read_file_text
from utils.similarity import cosine_sim


# =========================
# CONFIG
# =========================

EMBEDDINGS_FILE = r"D:\ai-cicd-security-tool\backend\ci-integrity\embeddings\malicious.pkl"
REPORT_DIR = "reports"
MODEL_NAME = "all-MiniLM-L6-v2"

# Risk thresholds
THRESHOLD_LOW = 0.50
THRESHOLD_MED = 0.65
THRESHOLD_HIGH = 0.80

# Folders to ignore
IGNORE_FOLDERS = [
    "venv", "env", "__pycache__", ".git", "node_modules",
    ".idea", ".vscode", "dist", "build", "migrations"
]

# File extensions to scan
SCAN_FILE_TYPES = (
    ".py", ".js", ".sh", ".yml", ".yaml",
    ".json", ".php", ".txt", "Dockerfile"
)


# =========================
# LOADING FUNCTIONS
# =========================

def load_embeddings():
    if not os.path.exists(EMBEDDINGS_FILE):
        raise FileNotFoundError("Missing embedding DB: " + EMBEDDINGS_FILE)

    with open(EMBEDDINGS_FILE, "rb") as f:
        return pickle.load(f)


def classify_risk(score):
    if score >= THRESHOLD_HIGH:
        return "HIGH"
    elif score >= THRESHOLD_MED:
        return "MEDIUM"
    elif score >= THRESHOLD_LOW:
        return "LOW"
    else:
        return "SAFE"


def threat_score(score):
    """Convert cosine similarity → threat % out of 100."""
    return round(score * 100, 1)


# =========================
# FILE CHUNKING
# =========================

def chunk_text(text, size=1500, overlap=200):
    """Split large files into overlapping chunks for better accuracy."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + size
        chunks.append(text[start:end])
        start += size - overlap
    return chunks


# =========================
# SCANNING FUNCTIONS
# =========================

def scan_chunk(model, chunk, db):
    emb = model.encode(chunk, convert_to_numpy=True)

    best_score = 0
    best_entry = None

    for entry in db:
        sim = cosine_sim(emb, entry["embedding"])
        if sim > best_score:
            best_score = sim
            best_entry = entry

    return best_score, best_entry


def scan_file(model, filepath, db):
    """Return highest score from ALL chunks of the file."""
    text = read_file_text(filepath)
    if not text.strip():
        return None, None

    chunks = chunk_text(text)
    best_score = 0
    best_entry = None

    for ch in chunks:
        score, entry = scan_chunk(model, ch, db)
        if score > best_score:
            best_score = score
            best_entry = entry

    return best_score, best_entry


def scan_repo(repo_path, fail_on_high=False):
    print("[pyguard] Loading model:", MODEL_NAME)
    model = SentenceTransformer(MODEL_NAME)

    print("[pyguard] Loading malicious DB...")
    db = load_embeddings()

    os.makedirs(REPORT_DIR, exist_ok=True)
    print(f"[pyguard] Scanning repo: {repo_path}")

    findings = []
    total_files = 0

    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d.lower() not in IGNORE_FOLDERS]

        for f in files:
            fp = os.path.join(root, f)

            if not fp.endswith(SCAN_FILE_TYPES):
                continue

            total_files += 1
            score, entry = scan_file(model, fp, db)
            if score is None or score < THRESHOLD_LOW:
                continue

            risk = classify_risk(score)
            tscore = threat_score(score)

            print(f"[alert] {fp} -> {risk} ({tscore}%)")

            findings.append({
                "file": fp,
                "score": float(score),
                "threat_percent": tscore,
                "risk": risk,
                "category": entry["category"],
                "matched_sample": entry["path"],
                "snippet": entry["text_snippet"][:300]
            })

    # Build summary
    summary = {
        "timestamp": str(datetime.now()),
        "repository": repo_path,
        "files_scanned": total_files,
        "findings": len(findings),
        "overall_risk": max([f["risk"] for f in findings], default="SAFE"),
        "details": findings
    }

    # Save reports
    json_report = os.path.join(REPORT_DIR, "embedding_report.json")
    with open(json_report, "w", encoding="utf-8") as jf:
        json.dump(summary, jf, indent=4)

    html_report = os.path.join(REPORT_DIR, "embedding_report.html")
    with open(html_report, "w", encoding="utf-8") as hf:
        hf.write(generate_html(summary))

    print(f"\n[pyguard] JSON report: {json_report}")
    print(f"[pyguard] HTML report: {html_report}")

    # Auto-fail if high risk
    if fail_on_high and summary["overall_risk"] == "HIGH":
        print("[pyguard] High-risk detected -> exiting with code 1")
        sys.exit(1)

    return summary


# =========================
# HTML REPORT (VigilantX Style)
# =========================

def generate_html(data):
    """Generate a VigilantX-styled HTML report with charts and dark UI."""
    risk_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    categories = {}

    for f in data.get("details", []):
        risk = f.get("risk", "LOW").upper()
        risk_counts[risk] = risk_counts.get(risk, 0) + 1
        cat = f.get("category", "Unknown")
        categories[cat] = categories.get(cat, 0) + 1

    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>PyGuard AI — Security Report</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            body {{
                font-family: 'Segoe UI', Arial, sans-serif;
                background: #0a192f;
                color: #ccd6f6;
                margin: 0;
                padding: 0;
            }}
            h1 {{
                color: #64ffda;
                text-align: center;
                padding: 25px 0 10px 0;
                font-size: 2rem;
            }}
            .container {{
                width: 90%;
                max-width: 1200px;
                margin: auto;
            }}
            .summary {{
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                justify-content: center;
                margin-bottom: 30px;
            }}
            .card {{
                background: #112240;
                border: 1px solid #233554;
                border-radius: 12px;
                padding: 20px;
                flex: 1 1 300px;
                min-width: 280px;
                box-shadow: 0 0 10px rgba(100,255,218,0.08);
            }}
            .card h2 {{
                color: #64ffda;
                margin-bottom: 12px;
                font-size: 1.2rem;
            }}
            canvas {{
                background: #0b1b30;
                border-radius: 10px;
                padding: 10px;
            }}
            .details {{
                margin-top: 40px;
            }}
            .finding {{
                background: #112240;
                border: 1px solid #233554;
                border-radius: 10px;
                padding: 15px;
                margin-bottom: 15px;
                transition: 0.2s;
            }}
            .finding:hover {{
                border-color: #64ffda;
                box-shadow: 0 0 10px rgba(100,255,218,0.2);
            }}
            .risk {{
                font-weight: bold;
                padding: 4px 8px;
                border-radius: 6px;
            }}
            .risk.CRITICAL {{ background: rgba(255, 0, 0, 0.2); color: #ff4c4c; }}
            .risk.HIGH {{ background: rgba(255, 165, 0, 0.2); color: #ffa500; }}
            .risk.MEDIUM {{ background: rgba(255, 255, 0, 0.15); color: #ffd700; }}
            .risk.LOW {{ background: rgba(50, 205, 50, 0.2); color: #9aff9a; }}
            code {{
                display: block;
                background: #0b1b30;
                color: #9aff9a;
                padding: 10px;
                border-radius: 8px;
                font-size: 13px;
                margin-top: 8px;
                white-space: pre-wrap;
                border: 1px solid #233554;
            }}
            footer {{
                text-align: center;
                color: #8892b0;
                font-size: 13px;
                margin: 40px 0;
            }}
        </style>
    </head>
    <body>
        <h1>🚀 PyGuard AI — Integrity & Code Injection Detection Report</h1>
        <div class="container">
            <div class="summary">
                <div class="card">
                    <h2>🧾 Summary</h2>
                    <p><b>Timestamp:</b> {data["timestamp"]}</p>
                    <p><b>Repository:</b> {data["repository"]}</p>
                    <p><b>Files Scanned:</b> {data["files_scanned"]}</p>
                    <p><b>Findings:</b> {data["findings"]}</p>
                    <p><b>Overall Risk:</b> <span class="risk {data["overall_risk"]}">{data["overall_risk"]}</span></p>
                </div>

                <div class="card">
                    <h2>Risk Score Chart</h2>
                    <canvas id="riskChart" width="300" height="300"></canvas>
                </div>

                <div class="card">
                    <h2>Threat Category Breakdown</h2>
                    <canvas id="categoryChart" width="300" height="300"></canvas>
                </div>
            </div>

            <div class="details">
                <h2 style="color:#64ffda;">🧠 Detailed Findings</h2>
    """

    for f in data["details"]:
        html += f"""
        <div class="finding">
            <h3><span class="risk {f["risk"]}">{f["risk"]}</span> — {f["file"].split(os.sep)[-1]}</h3>
            <p><b>Category:</b> {f["category"]}</p>
            <p><b>Threat %:</b> {f["threat_percent"]}%</p>
            <p><b>Matched Sample:</b> {f["matched_sample"]}</p>
            <p><b>File Path:</b> <small>{f["file"]}</small></p>
            <code>{f["snippet"]}</code>
        </div>
        """

    html += f"""
            </div>
        </div>

        <footer>
            PyGuard AI © 2025 — Securing CI/CD Integrity with Machine Learning
        </footer>

        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script>
        const ctx1 = document.getElementById('riskChart').getContext('2d');
        new Chart(ctx1, {{
            type: 'pie',
            data: {{
                labels: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
                datasets: [{{
                    data: [{risk_counts.get("CRITICAL",0)}, {risk_counts.get("HIGH",0)}, {risk_counts.get("MEDIUM",0)}, {risk_counts.get("LOW",0)}],
                    backgroundColor: ['#ff4c4c', '#ffa500', '#ffd700', '#32cd32'],
                    borderColor: '#0a192f',
                    borderWidth: 2
                }}]
            }},
            options: {{
                plugins: {{
                    legend: {{ labels: {{ color: '#ccd6f6' }} }}
                }}
            }}
        }});

        const ctx2 = document.getElementById('categoryChart').getContext('2d');
        new Chart(ctx2, {{
            type: 'bar',
            data: {{
                labels: {list(categories.keys())},
                datasets: [{{
                    label: 'Threat Count',
                    data: {list(categories.values())},
                    backgroundColor: '#64ffda'
                }}]
            }},
            options: {{
                scales: {{
                    x: {{ ticks: {{ color: '#ccd6f6' }} }},
                    y: {{ ticks: {{ color: '#ccd6f6' }} }}
                }},
                plugins: {{
                    legend: {{ labels: {{ color: '#ccd6f6' }} }}
                }}
            }}
        }});
        </script>
    </body>
    </html>
    """
    return html


# =========================
# MAIN
# =========================

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pyguard_embedding.py <repo-path> [--fail-on-high]")
        sys.exit(1)

    repo = sys.argv[1]
    flag = "--fail-on-high" in sys.argv

    scan_repo(repo, fail_on_high=flag)
