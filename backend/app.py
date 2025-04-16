from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)  # Enable CORS

JUDGE0_API_KEY = 'ca877b6fe2msh5f8c8b79520c79fp111279jsnc4e7070a7478'  # REPLACE THIS

@app.route('/execute', methods=['POST'])
def execute_code():
    try:
        code = request.json.get('code', '')
        response = requests.post(
            'https://judge0-ce.p.rapidapi.com/submissions',
            headers={
                'X-RapidAPI-Key': JUDGE0_API_KEY,
                'Content-Type': 'application/json',
            },
            json={
                'source_code': code,
                'language_id': 71,  # Python
                'stdin': '',
                'redirect_stderr_to_stdout': True
            }
        )
        return jsonify({'token': response.json()['token']})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/results/<token>', methods=['GET'])
def get_results(token):
    try:
        response = requests.get(
            f'https://judge0-ce.p.rapidapi.com/submissions/{token}?base64_encoded=true',
            headers={'X-RapidAPI-Key': JUDGE0_API_KEY}
        )
        return jsonify(response.json())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)