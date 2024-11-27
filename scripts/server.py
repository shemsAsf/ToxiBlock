from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
import pickle
import re
import os

# ===========================
# AI Functionality
# ===========================

model_path = os.path.join('scripts', 'Model.h5')
tokenizer_path = os.path.join('scripts', 'tokenizer.pickle')

# Charger le modèle pré-entraîné
best_model = load_model(model_path)

# Catégories de toxicité
categories = ['Toxic', 'Severe_toxic', 'Obscene', 'Threat', 'Insult', 'Identity_hate']

# Seuil de probabilité
threshold = 0.5

# Charger le tokenizer sauvegardé
with open(tokenizer_path, 'rb') as handle:
    tokenizer = pickle.load(handle)

# Nettoyer les nouveaux commentaires (comme dans la préparation initiale)
def clean_text(text):
    text = text.replace('\n', ' ')
    text = re.sub(r"[^a-zA-Z0-9\s.,!?']", ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def detect_hate(text):
    text = clean_text(text)

    censored_words = fetch_censored_words()

    normalized_text = text.lower()
    normalized_censored_words = [word.lower() for word in censored_words]
    words_in_text = set(normalized_text.split())
    # Check if any censored word is in the text
    if any(censored_word in words_in_text for censored_word in normalized_censored_words):
        print(text + " has returned with the category 'Censored'")
        return "Censored"

    # Convert new comments to sequences and pad them
    sequences = tokenizer.texts_to_sequences([text])
    padded_sequences = pad_sequences(sequences, padding='post', maxlen=150)  # Use the same maxlen as in training

    # Make predictions on the new comments
    predictions = best_model.predict(padded_sequences)

    # Find the category with the highest prediction value
    max_prediction = max(enumerate(predictions[0]), key=lambda x: x[1])
    
    # Get the category and the value
    max_category = categories[max_prediction[0]]
    max_value = max_prediction[1]

    if max_value < threshold:
        print(text + " has returned with the category 'safe'")
        return "safe"
    else:
        print(text + " has returned with the category '" + max_category + "'")
        return max_category 
    
# ===========================
# Api
# ===========================

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

        

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS censored_words (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word TEXT
        )
    ''')
    conn.commit()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='censored_words';")
    table_exists = cursor.fetchone()
    
    if table_exists:
        print("Table 'censored_words' exists or was created successfully.")
    else:
        print("Failed to create the table 'censored_words'.")
    
    conn.close()
    print("Database initialized successfully.")

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

    # Get counts grouped by day
    cursor.execute('SELECT date, SUM(count) FROM censor_log GROUP BY date ORDER BY date DESC')
    daily_counts = cursor.fetchall() 

    # Format data as a dictionary for easier access
    daily_data = {row[0]: row[1] for row in daily_counts}
    conn.close()

    return jsonify(daily_data), 200

@app.route('/get_top_categories', methods=['GET'])
def get_top_categories():
    conn = sqlite3.connect('censor_data.db')
    cursor = conn.cursor()

    # Query to get the top 3 categories with the most censored elements
    cursor.execute('''
        SELECT category, SUM(count) as total_count 
        FROM censor_log 
        GROUP BY category 
        ORDER BY total_count DESC 
        LIMIT 3
    ''')
    top_categories = cursor.fetchall()

    conn.close()

    # Format the response
    response = [
        {
            'category': category,
            'count': total_count
        } for category, total_count in top_categories
    ]

    return jsonify(response), 200

@app.route('/add_censored_word', methods=['POST'])
def addCensoredWord():
    data = request.json
    word = data.get('word', '')

    print("word: " + word)

    conn = sqlite3.connect('censor_data.db')
    cursor = conn.cursor()

    # Check if the word is already in the database
    cursor.execute('''SELECT word FROM censored_words WHERE word = ?''', (word,))
    result = cursor.fetchone()
    
    if result:
        print("Word already censored.")
        conn.close() 
        return jsonify({"message": "Word already censored."}), 400  
    else:
        cursor.execute('INSERT INTO censored_words (word) VALUES (?)', (word,))
        conn.commit() 
        conn.close() 
        print(f"Inserted new entry for {word}")
        
        return jsonify({"message": "Word added successfully."}), 201 

    

def fetch_censored_words():
    conn = sqlite3.connect('censor_data.db')
    cursor = conn.cursor()

    cursor.execute('''
        SELECT word 
        FROM censored_words 
    ''')
    result = cursor.fetchall()

    censored_words = [row[0] for row in result]

    conn.close()
    return censored_words

@app.route('/get_censored_words', methods=['GET'])
def getCensoredWords():
    censored_words = fetch_censored_words()
    return jsonify({'censoredWords': censored_words}), 200

@app.route('/remove_censored_word', methods=['DELETE'])
def remove_censored_word():
    data = request.json
    word = data.get('word', '')

    conn = sqlite3.connect('censor_data.db')
    cursor = conn.cursor()

    cursor.execute('DELETE FROM censored_words WHERE word = ?', (word,))
    conn.commit()
    conn.close()

    return jsonify({'message': f'Word "{word}" removed successfully.'}), 200


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000)