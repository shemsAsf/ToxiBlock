from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
from hate_detector import detect_hate
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def init_db():
    conn = sqlite3.connect('censor_data.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS censor_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            count INTEGER,
            date TEXT UNIQUE
        )
    ''')
    conn.commit()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='censor_log';")
    table_exists = cursor.fetchone()
    
    if table_exists:
        print("Table 'censor_log' exists or was created successfully.")
    else:
        print("Failed to create the table 'censor_log'.")
    
    conn.close()
    print("Database initialized successfully.")

@app.route('/detect-hate', methods=['POST'])
def detect_hate_api():
    data = request.get_json()
    tweet = data.get('tweet', '')
    
    is_hateful = detect_hate(tweet)
    return jsonify({'is_hateful': is_hateful})

@app.route('/log_censor', methods=['POST'])
def log_censor():
    data = request.json
    censor_count = data.get('count', 0)
    date = datetime.now().strftime('%Y-%m-%d')

    conn = sqlite3.connect('censor_data.db')
    cursor = conn.cursor()

    # Check if there's already an entry for today
    cursor.execute('SELECT count FROM censor_log WHERE date = ?', (date,))
    result = cursor.fetchone()

    if result:
        # If there's already an entry, increment the count
        new_count = result[0] + censor_count
        cursor.execute('UPDATE censor_log SET count = ? WHERE date = ?', (new_count, date))
        print(f"Updated count for {date}: {new_count}")
    else:
        # If no entry for today, insert a new row
        cursor.execute('INSERT INTO censor_log (count, date) VALUES (?, ?)', (censor_count, date))
        print(f"Inserted new entry for {date} with count: {censor_count}")

    conn.commit()
    conn.close()

    return jsonify({'status': 'success'}), 200

@app.route('/get_total_censor_count', methods=['GET'])
def get_total_censor_count():
    conn = sqlite3.connect('censor_data.db')
    cursor = conn.cursor()

    cursor.execute('SELECT SUM(count) FROM censor_log')
    total_count = cursor.fetchone()[0] or 0

    conn.close()

    return jsonify({'total_count': total_count}), 200

@app.route('/get_today_censor_count', methods=['GET'])
def get_today_censor_count():
    date = datetime.now().strftime('%Y-%m-%d')

    conn = sqlite3.connect('censor_data.db')
    cursor = conn.cursor()

    cursor.execute('SELECT SUM(count) FROM censor_log WHERE date = ?', (date,))
    today_count = cursor.fetchone()[0] or 0 

    conn.close()

    return jsonify({'today_count': today_count}), 200

@app.route('/get_month_censor_count', methods=['GET'])
def get_month_censor_count():
    month = datetime.now().strftime('%Y-%m')

    conn = sqlite3.connect('censor_data.db')
    cursor = conn.cursor()

    cursor.execute('SELECT SUM(count) FROM censor_log WHERE date LIKE ?', (f'{month}%',))
    month_count = cursor.fetchone()[0] or 0 

    conn.close()

    return jsonify({'month_count': month_count}), 200

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000)
