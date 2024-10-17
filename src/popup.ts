// #region Counters

let CActual = 0;
let CToday = 0;
let CMonth = 0;
let CTotal = 0;

function updateCensorCount(): void {
    const counts = { 
        'this-page': CActual, 
        'today': CToday, 
        'this-month': CMonth, 
        'total': CTotal 
    };

    Object.entries(counts).forEach(([key, value]) => {
        const countElement = document.getElementById(`blocked-${key}`);
        console.log("updating : " +`blocked-${key}`)
        if (countElement) {
            countElement.textContent = value.toString();
        }
    });
}

function fetchCensorCount(): void {
    chrome.storage.local.get(['censorCount'], (result) => {
        CActual = result.censorCount || 0;
        updateCensorCount();
    });
}

function fetchCensorCountFromAPI(): void {
    fetch('http://localhost:5000/get_censor_counts')
        .then(response => response.json())
        .then(data => {
            CTotal = data.total_count || 0;
            CToday = data.today_count || 0;
            CMonth = data.month_count || 0;
            updateCensorCount(); // Update the display after fetching
            console.log("Updated counts");
        })
        .catch((error) => {
            console.error('Error fetching censor counts from API:', error);
        });
}

// #endregion Counters

// #region Censoreship type

let previousCensorshipEnabled: boolean = false;

function setupCensorCheckbox() {
    const checkbox = document.getElementById('toggleCheckbox') as HTMLInputElement; // Type assertion

    if (checkbox) {
        // Restore the checkbox state from local storage
        chrome.storage.local.get('censorshipEnabled', (data) => {
            previousCensorshipEnabled = data.censorshipEnabled !== undefined ? data.censorshipEnabled : false;
            checkbox.checked = previousCensorshipEnabled;
        });

        checkbox.addEventListener('change', () => {
            const isChecked = checkbox.checked;
            const newCensorshipEnabled = isChecked;

            // Ask the user to confirm reloading the page
            const confirmReload = confirm("Changing this setting requires reloading the current page. Do you want to reload now?");
            if (confirmReload) {
                // If the user confirms, store the new state and reload the page
                chrome.storage.local.set({ censorshipEnabled: newCensorshipEnabled });
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs.length > 0) {
                        const activeTabId = tabs[0].id!;
                        chrome.tabs.sendMessage(activeTabId, {
                            action: 'toggleCensorship',
                            enabled: newCensorshipEnabled
                        });
                        chrome.tabs.reload(activeTabId);
                    }
                });
            } else {
                checkbox.checked = previousCensorshipEnabled;
            }
        });
    }
}

// #endregion Counters

// #region Categories

async function fetchTopCategories() {
    try {
        const response = await fetch('http://127.0.0.1:5000/get_top_categories'); 
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const categories = await response.json();
        displayCategories(categories);
    } catch (error) {
        console.error('Error fetching top categories:', error);
    }
}

function displayCategories(categories: Array<{ category: string; count: number }>) {
    // Loop through up to 3 categories
    for (let i = 1; i <= 3; i++) {
        const category = categories[i - 1] || { category: '---', count: 0 };
        
        // Dynamically get the name and count elements by their IDs
        const nameElement = document.getElementById(`category-name-${i}`);
        const countElement = document.getElementById(`category-count-${i}`);

        // Update category name and count if the elements exist
        if (nameElement) {
            nameElement.textContent = category.category;
        }
        if (countElement) {
            countElement.textContent = category.count.toString();
        }
    }
}

// #endregion Categories

// #region Censored Words

let censoredWords: Array<string> = []

function addCensoredWord(word: string){
    if (word && !censoredWords.includes(word)) {

        fetch('http://localhost:5000/add_censored_word', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({"word": word}),
        })
        .then(response => response.json())
        .then(() => {
            censoredWords.push(word);
            displayCensoredWords();
            console.log(word, 'Added to the censored words');
        })
    }
}

async function fetchCensoredWords() {
    try {
        const response = await fetch('http://127.0.0.1:5000/get_censored_words'); 
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const tCensoredWords = await response.json();
        censoredWords = tCensoredWords.censoredWords;
        displayCensoredWords();
    } catch (error) {
        console.error('Error fetching censored words:', error);
    }
}

function displayCensoredWords() {
    const wordListDiv = document.querySelector('.word-list');
    if (wordListDiv) {
        wordListDiv.innerHTML = ''; 

        censoredWords.forEach((word) => {
            let span = document.createElement('span');
            span.innerText = word;
            span.className = 'word-tag';
            wordListDiv.appendChild(span);
        });
    }
}

document.getElementById('censored-word-input')?.addEventListener('keydown', (event) => {
    const inputField = event.target as HTMLInputElement;
    if (event.key === 'Enter') { 
        const newWord = inputField.value.trim();

        if (newWord) {
            addCensoredWord(newWord);
            inputField.value = '';
        }
    }
});

// #endregion Censored Words

document.addEventListener('DOMContentLoaded', () => {
    fetchCensorCount();
    fetchCensorCountFromAPI();
    setupCensorCheckbox();
    fetchTopCategories();
    fetchCensoredWords();
});


