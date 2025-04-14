from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# REPLACE THIS WITH YOUR ACTUAL API KEY FROM RAPIDAPI
JUDGE0_API_KEY = 'ca877b6fe2msh5f8c8b79520c79fp111279jsnc4e7070a7478'  

@app.route('/execute', methods=['POST'])
def execute_code():
    try:
        # Get code from request
        code = request.json.get('code', '')
        
        # Send to Judge0 API
        response = requests.post(
            'https://judge0-ce.p.rapidapi.com/submissions',
            headers={
                'X-RapidAPI-Key': JUDGE0_API_KEY,
                'Content-Type': 'application/json',
            },
            json={
                'source_code': code,
                'language_id': 71,  # 71 = Python
                'stdin': '',        # No input needed
                'redirect_stderr_to_stdout': True
            }
        )
        response.raise_for_status()  # Throw error for bad status codes
        
        # Return token to frontend
        return jsonify({'token': response.json()['token']})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/results/<token>', methods=['GET'])
def get_results(token):
    try:
        # Get results from Judge0
        response = requests.get(
            f'https://judge0-ce.p.rapidapi.com/submissions/{token}?base64_encoded=false',
            headers={
                'X-RapidAPI-Key': JUDGE0_API_KEY,
                'Content-Type': 'application/json',
            }
        )
        response.raise_for_status()
        
        # Return full Judge0 response
        return jsonify(response.json())
        
    except requests.exceptions.HTTPError as e:
        return jsonify({'error': f'Judge0 API error: {str(e)}'}), 502
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)