import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
import pickle
import re
import os

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
        return "safe"
    else:
        return max_category 
