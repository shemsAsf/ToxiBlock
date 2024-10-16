from flask import Flask, request, jsonify
from flask_cors import CORS
from predict_toxicity import detect_hate
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def init_db():
    conn = sqlite3.connect('censor_data.db')
    cursor = conn.cursor()

    # Modify the table to store counts per category and date
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS censor_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            count INTEGER,
            date TEXT
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

categories = ['Toxic', 'Severe_toxic', 'Obscene', 'Threat', 'Insult', 'Identity_hate']

@app.route('/detect-hate', methods=['POST'])
def detect_hate_api():
    data = request.get_json()
    tweet = data.get('tweet', '')

    max_category = detect_hate(tweet)
    return jsonify({'category': max_category})

@app.route('/log_censor', methods=['POST'])
def log_censor():
    data = request.json
    date = datetime.now().strftime('%Y-%m-%d')

    conn = sqlite3.connect('censor_data.db')
    cursor = conn.cursor()

    # Loop through each category and log the counts
    for category, count in data.items():
        if count > 0:
            # Check if there's already an entry for today and the specific category
            cursor.execute('SELECT count FROM censor_log WHERE date = ? AND category = ?', (date, category))
            result = cursor.fetchone()

            if result:
                # If there's already an entry, increment the count
                new_count = result[0] + count
                cursor.execute('UPDATE censor_log SET count = ? WHERE date = ? AND category = ?', (new_count, date, category))
                print(f"Updated count for {date}, category {category}: {new_count}")
            else:
                # If no entry for today and this category, insert a new row
                cursor.execute('INSERT INTO censor_log (category, count, date) VALUES (?, ?, ?)', (category, count, date))
                print(f"Inserted new entry for {date}, category {category} with count: {count}")

    conn.commit()
    conn.close()

    return jsonify({'status': 'success'}), 200

@app.route('/get_censor_counts', methods=['GET'])
def get_censor_counts():
    conn = sqlite3.connect('censor_data.db')
    cursor = conn.cursor()

    # Get total count
    cursor.execute('SELECT SUM(count) FROM censor_log')
    total_count = cursor.fetchone()[0] or 0

    # Get today's count
    today = datetime.now().strftime('%Y-%m-%d')
    cursor.execute('SELECT SUM(count) FROM censor_log WHERE date = ?', (today,))
    today_count = cursor.fetchone()[0] or 0

    # Get this month's count
    month = datetime.now().strftime('%Y-%m')
    cursor.execute('SELECT SUM(count) FROM censor_log WHERE date LIKE ?', (f'{month}%',))
    month_count = cursor.fetchone()[0] or 0

    conn.close()

    return jsonify({
        'total_count': total_count,
        'today_count': today_count,
        'month_count': month_count
    }), 200


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000)
