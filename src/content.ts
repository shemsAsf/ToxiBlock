interface CensorCounts {
    Toxic: number;
    Severe_toxic: number;
    Obscene: number;
    Threat: number;
    Insult: number;
    Identity_hate: number;
    Total: number;
}

// Initialize the censorCounts object with the specified type
const censorCounts: CensorCounts = {
    Toxic: 0,
    Severe_toxic: 0,
    Obscene: 0,
    Threat: 0,
    Insult: 0,
    Identity_hate: 0,
    Total: 0,
};

const fullCensor = false;
let newCensoredElem = false;

async function censoredText(element: HTMLElement) {
    const textContent = element.innerText;

    // Send the text content to your Flask API for hate speech detection
    try {
        const response = await fetch('http://localhost:5000/detect-hate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tweet: textContent }), // Sending the text content to detect
        });

        if (response.ok) {
            const data = await response.json();
            if (data.category !== "safe") {
                const detectedCategory: keyof CensorCounts = data.category;

                const span = document.createElement('span');
                span.style.color = 'red';
                span.textContent = textContent; // Set the text content to the original text
                span.title = `Detected category: ${detectedCategory}`;
                element.innerHTML = ''; // Clear previous content
                element.appendChild(span); // Append the styled span

                censorCounts[detectedCategory] = (censorCounts[detectedCategory] || 0) + 1;
                censorCounts["Total"] = (censorCounts["Total"] || 0) + 1;

                chrome.storage.local.set({ 'censorCount': censorCounts["Total"] });
                chrome.runtime.sendMessage({ count: censorCounts["Total"] });
                newCensoredElem = true;
            }
        } else {
            console.error('Error detecting hate speech:', response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function logCensorCount(): void {
    const dataToSend = {
        Toxic: censorCounts.Toxic,
        Severe_toxic: censorCounts.Severe_toxic,
        Obscene: censorCounts.Obscene,
        Threat: censorCounts.Threat,
        Insult: censorCounts.Insult,
        Identity_hate: censorCounts.Identity_hate,
    };


    fetch('http://localhost:5000/log_censor', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
    }).then(response => response.json())
      .then(data => {
            console.log('Censor log stored:', data);

            // Reset the counts for each category except Total
            for (let category in censorCounts) {
                if (category !== 'Total') {
                    censorCounts[category as keyof CensorCounts] = 0;
                }
            }
      })
      .catch((error) => {
            console.error('Error logging censor data:', error);
      });
}

function processElements(newElements: HTMLElement[]) {
    newElements.forEach(element => {
        if (element) {
            censoredText(element); 
        };
    });
}

function observeDocumentChanges() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                console.log("added node : " + node);
                const newElementNodes: HTMLElement[] = [];

                if (node instanceof HTMLElement) {

                    textSelectors.forEach(selector => {
                        if (node.matches(selector)) {
                            newElementNodes.push(node);
                        }
                    });

                    const elements = node.querySelectorAll(textSelectors.join(', '));
                    if (elements.length > 0) {
                        elements.forEach(element => newElementNodes.push(element as HTMLElement));
                    }
                }

                if (newElementNodes.length > 0) {
                    console.log(`Processing ${newElementNodes.length} new elements`); // Console log for new elements
                    processElements(newElementNodes);
                }
            });
        });
    });

    // Observe the whole document for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

// Start observing for document changes with the desired selectors
const textSelectors = ['[data-testid="tweetText"]', '[data-testid="postText"]']; // List of selectors for text elements
observeDocumentChanges();

setInterval(() => {
    if(newCensoredElem){
        logCensorCount();
        newCensoredElem = false;
    }
}, (5000));