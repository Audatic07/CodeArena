from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow React to connect

@app.route('/')
def home():
    return "Backend is working!"

if __name__ == '__main__':
    app.run(debug=True)