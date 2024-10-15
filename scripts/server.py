from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
from hate_detector import detect_hate

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/detect-hate', methods=['POST'])
def detect_hate_api():
    data = request.get_json()
    tweet = data.get('tweet', '')
    
    is_hateful = detect_hate(tweet)
    return jsonify({'is_hateful': is_hateful})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
