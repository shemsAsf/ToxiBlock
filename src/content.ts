let censorCount = 0;
let censorCountToSend = 0;

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
            if (data.is_hateful) {
                const span = document.createElement('span');
                span.style.color = 'red';
                span.textContent = textContent; // Set the text content to the original text
                element.innerHTML = ''; // Clear previous content
                element.appendChild(span); // Append the styled span
                
                censorCount ++;
                censorCountToSend ++;
                chrome.storage.local.set({ 'censorCount': censorCount });
                chrome.runtime.sendMessage({ count: censorCount });
            }
        } else {
            console.error('Error detecting hate speech:', response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function logCensorCount(): void {
    fetch('http://localhost:5000/log_censor', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: censorCountToSend }),
    }).then(response => response.json())
      .then(data => {
          console.log('Censor log stored:', data);
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
    if (censorCount > 0) {
        logCensorCount();
        censorCountToSend = 0; 
    }
}, (5000));