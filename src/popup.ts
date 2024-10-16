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
        })
        .catch((error) => {
            console.error('Error fetching censor counts from API:', error);
        });
}

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

document.addEventListener('DOMContentLoaded', () => {
    fetchCensorCount();
    fetchCensorCountFromAPI();
    setupCensorCheckbox();
});
