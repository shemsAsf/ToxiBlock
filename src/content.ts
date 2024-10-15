const processedTweetElements: HTMLElement[] = [];

async function censorTweet(element: HTMLElement) {
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
                element.innerText = censoredText; // Replace the text content in the DOM
            }
        } else {
            console.error('Error detecting hate speech:', response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function processTweets(newTweets: HTMLElement[]) {
    newTweets.forEach(tweet => {
        console.log("Processing tweet : " + tweet);
        const tweetTextElement = tweet.querySelector('[data-testid="tweetText"]') as HTMLElement;
        
        if (tweetTextElement) {
            censorTweet(tweetTextElement);
        }
    });
}

function observeDocumentChanges() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            const newTweetNodes: HTMLElement[] = [];
            mutation.addedNodes.forEach(node => {
                console.log("added node : " + node);
                // Check if the added node is a tweet
                if (node instanceof HTMLElement && node.matches('[data-testid="tweet"]')) {
                    newTweetNodes.push(node);
                } 
                else if (node instanceof HTMLElement) {
                    // If it's not a tweet, check for any tweet children
                    const tweets = node.querySelectorAll('[data-testid="tweet"]');
                    if (tweets.length > 0) {
                        tweets.forEach(tweet => newTweetNodes.push(tweet as HTMLElement));
                    }
                }
            });
            processTweets(newTweetNodes);
        });
    });

    // Observe the whole document for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

observeDocumentChanges();