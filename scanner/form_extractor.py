# scanner/form_extractor.py

import requests
from bs4 import BeautifulSoup

def extract_forms_from_url(url):
    try:
        response = requests.get(url)
        if response.status_code != 200:
            print(f"❌ Failed to fetch the website. Status code: {response.status_code}")
            return []
        soup = BeautifulSoup(response.text, "html.parser")
        forms = soup.find_all("form")
        return [str(form) for form in forms]
    except Exception as e:
        print(f"❌ Failed to fetch forms: {e}")
        return []
