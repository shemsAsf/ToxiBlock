# ToxiBlock - Chrome Extension

ToxiBlock is a Chrome extension designed to help identify and censor hate speech on social media platforms like Twitter. The extension either censors or flags harmful text in red based on user preferences.

## Installation Guide

1. **Prerequisites:**
   - Make sure you have Python 3.11 installed on your system.

2. **Setting Up the Project:**
   - Clone or download this repository to your local machine.
   - Navigate to the project directory and run the following setup scripts:
     1. Run `setup.bat` to install the necessary dependencies.
     2. Run `start.bat` to start the Flask server, which must remain running locally for the extension to work properly.

3. **Install the Chrome Extension:**
   - Open Chrome and go to the Extensions page: [chrome://extensions/](chrome://extensions/).
   - Enable **Developer Mode** in the top-right corner.
   - Click on **Load unpacked** and select the project folder. This will load the ToxiBlock extension into Chrome.
   - When prompted, grant the necessary permissions.

4. **Using the Extension:**
   - After installation, visit [Twitter](https://x.com/).
   - The extension will either censor or flag potentially harmful content in red, based on the option selected in the popup window of the extension.

5. **Adding Censored Words:**
   - You can manually add words that you want to censor through the popup interface of the extension. Simply open the popup, enter the word you want to censor, and press Enter.
   - Once added, any post containing this word will automatically be blocked or flagged by the extension on Twitter, regardless of whether the text is detected as hate speech by the AI.


## How It Works

### Functionality
- ToxiBlock monitors text on Twitter and censors or flags it based on a home-trained AI model.
- The user can toggle between censoring and flagging mode using a checkbox in the popup window.
- Users can also add specific words to censor through the popup, and the extension will block every post that contains these words.

### Technical Details

#### TypeScript and JavaScript
- The project is written in TypeScript and compiled to JavaScript, which is used to inject the content script into the browser to detect and modify the web page in real time.

#### Flask Server and AI Model
- The extension communicates with a Flask server running locally, which processes text using a home-trained AI model.
  
  The AI model is responsible for categorizing text into one of six potential categories of toxicity, including `Toxic`, `Severe_toxic`, `Obscene`, `Threat`, `Insult`, and `Identity_hate`. When new text is processed, the AI model predicts the level of hate speech based on these categories. If the prediction exceeds a set probability threshold, the text is flagged as harmful.

  Additionally, a list of censored words is checked against the text. If any of these words are present, the script return the category `Censored` and the text is immediately flagged or censored, bypassing the AI prediction.

  The text is pre-processed by cleaning it, removing unwanted characters, and tokenizing it before being fed into the model. Predictions are then made, and the text is classified as either safe, censored, or falling into one of the defined hate speech categories.

### SQLite Database

We use an SQLite database to store logs of detected hate speech and a list of censored words. The database contains two tables:

- `censor_log`: Tracks the category of detected speech, the count, and the date of detection.
  
- `censored_words`: Stores words that are to be censored.