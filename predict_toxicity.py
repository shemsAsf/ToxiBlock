import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
import pickle
import re

# Chemin des fichiers sauvegardés
model_path = '/Users/eric/Documents/kaggle/Model.h5'
tokenizer_path = '/Users/eric/Documents/kaggle/tokenizer.pickle'

# Charger le modèle pré-entraîné
best_model = load_model(model_path)

# Charger le tokenizer sauvegardé
with open(tokenizer_path, 'rb') as handle:
    tokenizer = pickle.load(handle)


new_comments =  [
    "This is the biggest pile of crap I've ever seen.",
    "What the hell are you talking about? You're full of shit.",
    "Shut the fuck up, nobody asked for your opinion."
]

# Nettoyer les nouveaux commentaires (comme dans la préparation initiale)
def clean_text(text):
    text = text.replace('\n', ' ')
    text = re.sub(r"[^a-zA-Z0-9\s.,!?']", ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

new_comments = [clean_text(comment) for comment in new_comments]

# Convertir les nouveaux commentaires en séquences et les padder
sequences = tokenizer.texts_to_sequences(new_comments)
padded_sequences = pad_sequences(sequences, padding='post', maxlen=150)  # Utiliser la même longueur max que pour l'entraînement

# Faire des prédictions sur les nouveaux commentaires
predictions = best_model.predict(padded_sequences)

# Catégories de toxicité
categories = ['Toxic', 'Severe_toxic', 'Obscene', 'Threat', 'Insult', 'Identity_hate']

# Seuil de probabilité
threshold = 0.5

# Afficher les résultats de manière plus lisible
for i, prediction in enumerate(predictions):
    print(f"\nCommentaire {i+1}: {new_comments[i]}")
    print("Catégories où la toxicité dépasse le seuil :")
    toxic_categories = [(categories[j], pred) for j, pred in enumerate(prediction) if pred > threshold]
    
    if toxic_categories:
        for category, score in toxic_categories:
            print(f"{category} : {score:.2f}")
    else:
        print("Commentaire correct")
