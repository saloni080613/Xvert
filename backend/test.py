import requests

url = "http://localhost:8000/v1/convert/document"
headers = {"X-API-Key": "xvt_1234dummy"} # This is just testing if it fails with invalid key
files = {"file": ("test.txt", b"dummy content")}
data = {"target_format": "docx"}

r = requests.post(url, headers=headers, files=files, data=data)
print(r.status_code)
print(r.text)
