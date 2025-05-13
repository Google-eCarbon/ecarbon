import requests

def get_html_file(url) -> str:
    """URL에서 HTML 내용을 가져옵니다."""
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"HTML 가져오기 실패: {str(e)}")
        return ""
