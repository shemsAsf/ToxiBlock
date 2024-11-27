// #region Counters
interface CensorCounts {
    [date: string]: number;
}

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

function fetchRawCensorCountPerDayFromAPI(): Promise<CensorCounts | undefined> {
    return fetch('http://localhost:5000/get_censor_counts')
        .then(response => {
            return response.json();
        })
        .then(data => {
            console.log('Data received from API:', data);
            return data;
        })
        .catch((error) => {
            console.error('Error fetching censor counts from API:', error);
        });
}


function populateCensorCounts(): void {
    fetchRawCensorCountPerDayFromAPI()
        .then((data: CensorCounts | undefined) => {
            if (!data) return; 
            
            console.log(data)
            const dailyCounts = data; 
            let totalCount = 0;
            let todayCount = 0;
            let monthCount = 0;

            const todayDate = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
            const currentMonth = todayDate.slice(0, 7); // Get the current month (YYYY-MM)

            // Calculate the total count, today's count, and the monthly count
            for (const [date, count] of Object.entries(dailyCounts)) {
                totalCount += count;
                if (date === todayDate) {
                    todayCount = count;
                }
                if (date.startsWith(currentMonth)) {
                    monthCount += count;
                }
            }

            // Update the display with the counts
            CTotal = totalCount;
            CToday = todayCount;
            CMonth = monthCount;
            updateCensorCount();

            console.log("Updated counts: Total:", CTotal, "Today:", CToday, "Month:", CMonth);
        });
}

// #endregion Counters

// #region Censoreship type

// Get references to the toggle checkbox and descriptions
const toggleCheckbox = document.getElementById('toggle-preference') as HTMLInputElement;
const flagRedDescription = document.querySelector('.flag-red') as HTMLSpanElement;
const hideElementsDescription = document.querySelector('.hide-elements') as HTMLSpanElement;

// Function to update the descriptions based on the toggle state
function updateDescription() {
    if (toggleCheckbox.checked) {
        flagRedDescription.style.display = 'none'; 
        hideElementsDescription.style.display = 'inline';
        console.log('Flagging all censored items in red');
    } else {
        flagRedDescription.style.display = 'inline'; 
        hideElementsDescription.style.display = 'none';
        console.log('Hiding all censored items');
    }
}

toggleCheckbox.dispatchEvent(new Event('change'));

function setupCensorToggle() {
    const toggle = document.getElementById('toggle-preference') as HTMLInputElement;

    if (toggle) {
        chrome.storage.local.get('censorshipEnabled', (data) => {
            const previousCensorshipEnabled = data.censorshipEnabled !== undefined ? data.censorshipEnabled : false;
            toggle.checked = previousCensorshipEnabled;
        });

        toggle.addEventListener('change', () => {
            const isChecked = toggle.checked;
            const newCensorshipEnabled = isChecked;

            const confirmReload = confirm("Changing this setting requires reloading the current page. Do you want to reload now?");
            if (confirmReload) {
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
                toggle.checked = !newCensorshipEnabled; 
            }
            updateHeaderImage(newCensorshipEnabled);
            updateDescription();
        });
    }
}

function updateHeaderImage(isCensorshipEnabled: boolean) {
    const headerImage = document.getElementById('header-image') as HTMLImageElement;
    if (headerImage) {
        if (isCensorshipEnabled) {
            headerImage.src = '../resources/Toxiblock_logo_censored.png'; // Set image when censorship is enabled
        } else {
            headerImage.src = '../resources/Toxiblock_logo_flagged.png'; // Set image when censorship is disabled
        }
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
            span.onclick = () => removeCensoredWord(word); // Add click event
            wordListDiv.appendChild(span);
        });
    }
}

function removeCensoredWord(word: string) {
    fetch('http://localhost:5000/remove_censored_word', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "word": word }),
    })
    .then(response => {
        if (response.ok) {
            censoredWords = censoredWords.filter(w => w !== word);
            displayCensoredWords(); 
            console.log(`${word} removed from censored words`);
        } else {
            console.error('Failed to remove the word from censored words');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
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
    populateCensorCounts();
    setupCensorToggle();
    fetchTopCategories();
    fetchCensoredWords();

    chrome.storage.local.get('censorshipEnabled', (data) => {
        const censorshipEnabled = data.censorshipEnabled !== undefined ? data.censorshipEnabled : false;
        updateHeaderImage(censorshipEnabled);
        updateDescription(); 
    });
});