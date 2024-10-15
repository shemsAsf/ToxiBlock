let censorCount = 0;

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
                // Censor the text by replacing each character with '*', except spaces
                const censoredText = textContent.replace(/[^ ]/g, '*');
                element.innerText = censoredText; 
                censorCount ++;
            }
        } else {
            console.error('Error detecting hate speech:', response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
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