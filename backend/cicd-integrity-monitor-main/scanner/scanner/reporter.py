import json
import os
import requests
from rich.console import Console
from rich.table import Table
from jinja2 import Template

# ------------------------------------------------------------------------------------
# HTML TEMPLATE (card-style UI + modal + attack_type support)
# ------------------------------------------------------------------------------------
HTML_TEMPLATE = """
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Scan Report</title>

<style>
    body {
        margin: 0;
        font-family: 'Segoe UI', Roboto, sans-serif;
        background: #0f172a;
        color: #e2e8f0;
        padding: 20px;
    }

    h1 {
        font-size: 30px;
        margin-bottom: 20px;
        color: #38bdf8;
        text-align: center;
    }

    .meta-box {
        background: #1e293b;
        padding: 18px;
        border-radius: 10px;
        margin-bottom: 30px;
        border: 1px solid #334155;
    }

    .meta-box b {
        color: #93c5fd;
    }

    /* Grid of cards */
    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 18px;
    }

    .card {
        background: #1e293b;
        border-radius: 10px;
        padding: 16px;
        cursor: pointer;
        border: 1px solid #334155;
        transition: 0.25s;
    }

    .card:hover {
        transform: translateY(-4px);
        border-color: #60a5fa;
    }

    .ml-card {
        border-left: 6px solid #f59e0b !important;
    }

    .static-card {
        border-left: 6px solid #6366f1 !important;
    }

    .card-title {
        font-size: 18px;
        color: #f8fafc;
        margin-bottom: 6px;
    }

    .attack-type {
        font-size: 13px;
        color: #fbbf24;
        margin-bottom: 10px;
    }

    .card-sub {
        font-size: 14px;
        color: #94a3b8;
        margin-bottom: 10px;
    }

    .score-badge {
        display: inline-block;
        padding: 4px 8px;
        font-size: 13px;
        border-radius: 6px;
        color: white;
    }

    .high { background: #ef4444; }
    .medium { background: #f59e0b; }
    .low { background: #3b82f6; }

    /* Modal */
    .modal-bg {
        display: none;
        position: fixed;
        top: 0; left: 0;
        height: 100%;
        width: 100%;
        background: rgba(0,0,0,0.7);
        justify-content: center;
        align-items: center;
        z-index: 999;
    }

    .modal {
        background: #1e293b;
        width: 90%;
        max-width: 650px;
        padding: 25px;
        border-radius: 12px;
        border: 1px solid #475569;
        box-shadow: 0 10px 40px rgba(0,0,0,0.4);
    }

    .modal h2 {
        margin-top: 0;
        color: #38bdf8;
    }

    .attack-badge {
        display: inline-block;
        background: #f59e0b;
        padding: 4px 10px;
        border-radius: 8px;
        margin-bottom: 12px;
        font-size: 13px;
        color: #1e1e1e;
    }

    .close-btn {
        float: right;
        background: #ef4444;
        padding: 5px 10px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
    }

    pre {
        background: #0f172a;
        padding: 12px;
        border-radius: 8px;
        overflow-x: auto;
        border: 1px solid #334155;
        color: #e2e8f0;
    }

</style>

<script>
function showModal(index) {
    document.getElementById("modal-" + index).style.display = "flex";
}
function closeModal(index) {
    document.getElementById("modal-" + index).style.display = "none";
}
</script>

</head>
<body>

<h1>CI/CD Integrity Scan Report</h1>

<div class="meta-box">
    <p><b>Path:</b> {{ meta.path }}</p>
    <p><b>Score:</b> {{ score }}
    {% if action == "fail" %}
        <span class="score-badge high">FAIL</span>
    {% elif action == "warn" %}
        <span class="score-badge medium">WARN</span>
    {% else %}
        <span class="score-badge low">ALLOW</span>
    {% endif %}
    </p>
</div>

<div class="cards">
{% for f in findings %}
    <div class="card {% if f.detector.startswith('ml_') %}ml-card{% else %}static-card{% endif %}"
         onclick="showModal({{ loop.index }})">

        <div class="card-title">{{ f.detector }}</div>
        <div class="card-sub">{{ f.id }}</div>

        {% if f.attack_type %}
        <div class="attack-type">Attack Type: {{ f.attack_type }}</div>
        {% endif %}

        <span class="score-badge 
            {% if f.score >= 7 %}high
            {% elif f.score >= 4 %}medium
            {% else %}low{% endif %}">
            score: {{ f.score }}
        </span>
    </div>

    <!-- Modal -->
    <div class="modal-bg" id="modal-{{ loop.index }}">
        <div class="modal">

            <span class="close-btn" onclick="closeModal({{ loop.index }})">Close</span>

            <h2>{{ f.detector }} — {{ f.id }}</h2>

            {% if f.attack_type %}
                <div class="attack-badge">Attack Detected: {{ f.attack_type }}</div>
            {% endif %}

            <p><b>File:</b> {{ f.file }}</p>
            <p>{{ f.description }}</p>

            {% if f.meta %}
            <h3>Metadata</h3>
            <pre>{{ f.meta | safe }}</pre>
            {% endif %}
        </div>
    </div>
{% endfor %}
</div>

</body>
</html>
"""

# ------------------------------------------------------------------------------------
# AUTO-UPLOAD TO API
# ------------------------------------------------------------------------------------
def _post_to_api(json_file, html_file):
    api = os.environ.get("REPORT_API_URL")
    if not api:
        return

    try:
        with open(json_file, "r", encoding="utf-8") as jf:
            payload = json.load(jf)

        try:
            with open(html_file, "r", encoding="utf-8") as hf:
                payload["report_html"] = hf.read()
        except:
            payload["report_html"] = None

        url = api.rstrip("/") + "/incidents"
        requests.post(url, json=payload, timeout=10)

    except Exception as e:
        print(f"[WARN] Failed to upload report to API: {e}")


# ------------------------------------------------------------------------------------
# REPORTER CLASS (console + HTML)
# ------------------------------------------------------------------------------------
class Reporter:

    @staticmethod
    def print_console(result):
        console = Console()
        console.print("[bold cyan]CI/CD Integrity Scanner Report[/bold cyan]\n")

        console.print(f"[bold]Path:[/bold] {result['meta']['path']}")
        console.print(f"[bold]Score:[/bold] {result['score']}   [bold]Action:[/bold] {result['action']}\n")

        findings = result.get("findings", [])

        # STATIC FINDINGS
        normal = [f for f in findings if not f["detector"].startswith("ml_")]

        if normal:
            table = Table(show_header=True, header_style="bold magenta")
            table.add_column("Detector")
            table.add_column("ID")
            table.add_column("File")
            table.add_column("Score")
            table.add_column("Description")

            for f in normal:
                table.add_row(f["detector"], f["id"], f["file"], str(f["score"]), f["description"])

            console.print(table)

        # ML FINDINGS
        ml = [f for f in findings if f["detector"].startswith("ml_")]

        if ml:
            console.print("\n[bold yellow]Machine Learning Analysis[/bold yellow]\n")
            table = Table(show_header=True, header_style="bold yellow")
            table.add_column("Detector")
            table.add_column("ID")
            table.add_column("File")
            table.add_column("Attack Type")
            table.add_column("Score")
            table.add_column("Description")

            for f in ml:
                table.add_row(
                    f["detector"],
                    f["id"],
                    f["file"],
                    str(f.get("attack_type", "")),
                    str(f["score"]),
                    f["description"]
                )

            console.print(table)

    @staticmethod
    def write_reports(result, out_json="report.json", out_html="report.html"):
        """
        Always write reports to:
        D:/ai-cicd-security-tool/backend/scan_reports/
        """
        reports_dir = r"D:\ai-cicd-security-tool\backend\scan_reports"
        os.makedirs(reports_dir, exist_ok=True)

        out_json_path = os.path.join(reports_dir, "report.json")
        out_html_path = os.path.join(reports_dir, "report.html")

        # Write JSON
        with open(out_json_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)

        # Generate HTML
        html = Template(HTML_TEMPLATE).render(
            meta=result["meta"],
            score=result["score"],
            action=result["action"],
            findings=result["findings"]
        )

        with open(out_html_path, "w", encoding="utf-8") as f:
            f.write(html)

        # Optional upload
        _post_to_api(out_json_path, out_html_path)

        print(f"[INFO] Reports written to:\n{out_json_path}\n{out_html_path}")
        return out_json_path, out_html_path
