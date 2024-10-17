interface CensorCounts {
    Toxic: number;
    Severe_toxic: number;
    Obscene: number;
    Threat: number;
    Insult: number;
    Identity_hate: number;
    Censored: number;
    Total: number;
}

const censorCounts: CensorCounts = {
    Toxic: 0,
    Severe_toxic: 0,
    Obscene: 0,
    Threat: 0,
    Insult: 0,
    Identity_hate: 0,
    Censored:0,
    Total: 0,
};

let isCensorshipEnabled: boolean = false;

let newCensoredElem = false;

async function censoredText(element: HTMLElement) {
    const textContent = element.innerText;
    try {
        const response = await fetch('http://localhost:5000/detect-hate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tweet: textContent }),
        });

        if (response.ok) {
            const data = await response.json();
            if (data.category !== "safe") {
                const detectedCategory: keyof CensorCounts = data.category;
                
                let modifiedTextContent = textContent;
                const span = document.createElement('span');
        
                if (isCensorshipEnabled) {
                    modifiedTextContent = textContent.replace(/[^ ]/g, '*');
                } else {
                    span.style.color = 'red';
                }
                span.textContent = modifiedTextContent;
                span.title = `Detected category: ${detectedCategory}`;
                element.innerHTML = ''; 
                element.appendChild(span);

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
        Censored: censorCounts.Censored
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
                    console.log(`Processing ${newElementNodes.length} new elements`);
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
const textSelectors = ['[data-testid="tweetText"]', '[data-testid="postText"]']; 
observeDocumentChanges();

setInterval(() => {
    if(newCensoredElem){
        logCensorCount();
        newCensoredElem = false;
    }
}, (5000));

chrome.storage.local.get('censorshipEnabled', (data) => {
    if (data.censorshipEnabled !== undefined) {
        isCensorshipEnabled = data.censorshipEnabled;
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleCensorship') {
        isCensorshipEnabled = request.enabled;
        console.log("toggleCensorship ", isCensorshipEnabled);
    }
});