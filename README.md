
# ToxiBlock

**ToxiBlock** est une application de classification des commentaires toxiques qui utilise un modèle de Machine Learning basé sur TensorFlow et Keras. Ce projet permet de prédire les probabilités qu'un commentaire soit toxique, très toxique, obscène, une menace, une insulte, ou contienne des propos haineux visant une identité.

## Sommaire

L'objectif de **ToxiBlock** est de créer un système capable de détecter des commentaires inappropriés ou nuisibles, permettant ainsi de modérer des forums, des réseaux sociaux, ou toute plateforme où la sécurité des interactions est primordiale. Grâce à un modèle pré-entraîné, l'application peut analyser des textes et assigner des probabilités à différentes catégories de toxicité.

## Fonctionnalités principales
- **Classification des commentaires** : L'application prend en entrée un commentaire et prédit les probabilités qu'il appartienne à l'une des six catégories de toxicité :
  1. **Toxic** : Toxique en général
  2. **Severe_toxic** : Très toxique
  3. **Obscene** : Obscène
  4. **Threat** : Menace
  5. **Insult** : Insulte
  6. **Identity_hate** : Discours haineux visant une identité (race, sexe, etc.)

- **Modèle pré-entraîné** : Le modèle est basé sur des couches LSTM bidirectionnelles pour capturer les dépendances temporelles dans le texte. Le modèle est stocké dans un fichier **`Model.h5`**.

- **Nettoyage des données** : Les commentaires sont nettoyés avant d'être analysés, éliminant les caractères spéciaux et les espaces superflus pour une meilleure précision du modèle.

- **Personnalisation des prédictions** : L'utilisateur peut facilement ajuster le seuil de probabilité pour définir à partir de quel pourcentage un commentaire est jugé toxique.

## Prérequis

Le projet nécessite **Python 3.7+** et les bibliothèques suivantes pour fonctionner :

- **TensorFlow** : Pour l'exécution du modèle d'apprentissage profond.
- **Keras Tuner** : Pour l'optimisation des hyperparamètres du modèle.
- **Pandas** : Pour la gestion des données.
- **NumPy** : Pour les calculs mathématiques et la manipulation de tableaux.
- **Matplotlib** et **Seaborn** : Pour les visualisations de données.
- **Pickle5** : Pour la sérialisation du tokenizer.

## Installation

Pour installer les dépendances, vous pouvez exécuter l'une des commandes suivantes en fonction du fichier fourni :

### Via `requirements.txt` :
```bash
pip install -r requirements.txt
```

### Via `setup.py` :
```bash
python setup.py install
```

## Utilisation

1. Clonez ce dépôt sur votre machine locale :
   ```bash
   git clone https://github.com/shemsAsf/ToxiBlock.git
   cd ToxiBlock
   ```

2. Installez les dépendances :
   ```bash
   pip install -r requirements.txt
   ```

3. Lancez le script de prédiction **`predict_toxicity.py`** pour analyser de nouveaux commentaires :
   ```bash
   python predict_toxicity.py
   ```

### Exemple d'utilisation

```python
new_comments = ["You are an awful person!", "Have a great day!"]


# Faire des prédictions sur les commentaires
predictions = best_model.predict(padded_sequences)

# Résultat :
# Commentaire 1: Toxic: 78%, Insult: 65%
# Commentaire 2: Aucune toxicité détectée
```

## Contribution

Les contributions sont les bienvenues ! Si vous souhaitez ajouter de nouvelles fonctionnalités ou améliorer le code existant, n'hésitez pas à forker le projet et soumettre une pull request.

## Licence

Ce projet est sous licence MIT. Consultez le fichier [LICENSE](./LICENSE) pour plus de détails.

