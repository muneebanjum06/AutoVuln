import requests
from config import API_URL, API_KEY, MODEL_NAME

def send_to_deepseek(form_data):
    prompt = "Analyze the following HTML forms for vulnerabilities:\n\n" + "\n\n".join(form_data)

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "AutoVuln Scanner"
    }

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {
                "role": "system", 
                "content": "You're a cybersecurity AI. For each vulnerability found, provide:\n"
                          "**Vulnerability:** [Name]\n"
                          "**Issue:** [Description]\n"
                          "**Fix:** [Solution]\n\n"
                          "Be concise and professional. Don't include form code examples."
            },
            {
                "role": "user", 
                "content": prompt
            }
        ]
    }

    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        if response.status_code == 200:
            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
            return content
        else:
            print(f"API Error: {response.status_code}")
            return ""
    except Exception as e:
        print(f"API Request Failed: {e}")
        return ""