from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
import requests
from bs4 import BeautifulSoup
from fpdf import FPDF

app = Flask(__name__)
CORS(app)  # Enable CORS for all domains

# ========== CONFIGURATION ========== 
API_URL = "https://openrouter.ai/api/v1/chat/completions"
API_KEY = "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"  # Replace with your actual OpenRouter API key
MODEL_NAME = "deepseek/deepseek-chat:free"
OUTPUT_PDF = "vulnerability_report.pdf"
# ===================================

# Function to extract HTML forms from a URL
def extract_forms_from_url(url):
    try:
        response = requests.get(url)
        # Check if the response was successful
        if response.status_code != 200:
            print(f"❌ Failed to fetch the website. Status code: {response.status_code}")
            return []
        soup = BeautifulSoup(response.text, "html.parser")
        forms = soup.find_all("form")
        return [str(form) for form in forms]
    except Exception as e:
        print(f"❌ Failed to fetch forms: {e}")
        return []

# Function to send form data to the DeepSeek API for analysis
def send_to_deepseek(form_data):
    prompt = "Analyze the following HTML forms for vulnerabilities and suggest fixes:\n\n" + "\n\n".join(form_data)

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",  # Change this if necessary
        "X-Title": "AutoPen Vulnerability Scanner"
    }

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": "You're a cybersecurity AI that scans HTML forms for vulnerabilities."},
            {"role": "user", "content": prompt}
        ]
    }

    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        if response.status_code == 200:
            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
            return content
        else:
            print(f"❌ API returned error: {response.status_code}")
            return ""
    except Exception as e:
        print(f"❌ API call failed: {e}")
        return ""

# Function to save the analysis result into a PDF
def save_to_pdf(content, filename):
    pdf = FPDF()
    pdf.add_page()

    # Add fonts
    pdf.add_font("DejaVu", "", "dejavu-fonts-ttf-2.37/DejaVuSans.ttf", uni=True)
    pdf.add_font("DejaVu", "B", "dejavu-fonts-ttf-2.37/DejaVuSans-Bold.ttf", uni=True)

    # Title
    pdf.set_font("DejaVu", "B", 16)
    pdf.cell(200, 10, txt="Vulnerability Analysis Report", ln=True, align='C')
    pdf.ln(10)

    # Content
    pdf.set_font("DejaVu", "", 12)
    for line in content.split("\n"):
        pdf.multi_cell(0, 10, line)

    pdf.output(filename)

# Route to handle the scanning request
@app.route('/scan', methods=['POST'])
def scan():
    data = request.get_json()
    url = data.get('url')

    # Validate URL
    if not url:
        return jsonify({'error': 'No URL provided'}), 400

    forms = extract_forms_from_url(url)

    if not forms:
        return jsonify({'error': 'No forms found or failed to load the site'}), 400

    print(f"✅ Found {len(forms)} forms. Sending to DeepSeek for analysis...")

    report = send_to_deepseek(forms)
    
    if report:
        save_to_pdf(report, OUTPUT_PDF)
        return jsonify({'message': 'Scan complete! Report saved to ' + OUTPUT_PDF})
    else:
        return jsonify({'error': 'Failed to generate a report'}), 500

if __name__ == "__main__":
    app.run(debug=True)
