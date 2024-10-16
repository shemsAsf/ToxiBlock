let CActual = 0;
let CToday = 0;
let CMonth = 0;
let CTotal = 0;

function updateCensorCount(): void {
    const counts = { 
        actual: CActual, 
        today: CToday, 
        month: CMonth, 
        total: CTotal 
    };

    // Directly using IDs without transformation
    Object.entries(counts).forEach(([key, value]) => {
        const countElement = document.getElementById(`count${key.charAt(0).toUpperCase() + key.slice(1)}`);
        if (countElement) {
            countElement.textContent = value.toString();
        }
    });
}

function fetchCensorCount(): void {
    chrome.storage.local.get(['censorCount'], (result) => {
        CActual = result.censorCount || 0;
        updateCensorCount(); // Update the count after fetching
    });
}

function fetchCensorCountFromAPI(endpoint: string, updateVar: (count: number) => void): void {
    fetch(endpoint)
        .then(response => response.json())
        .then(data => {
            updateVar(data[Object.keys(data)[0]] || 0); // Use the first key to get the count
            updateCensorCount(); // Update the display after fetching
        })
        .catch((error) => {
            console.error(`Error fetching censor count from ${endpoint}:`, error);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchCensorCount();
    fetchCensorCountFromAPI('http://localhost:5000/get_total_censor_count', (count) => CTotal = count);
    fetchCensorCountFromAPI('http://localhost:5000/get_today_censor_count', (count) => CToday = count);
    fetchCensorCountFromAPI('http://localhost:5000/get_month_censor_count', (count) => CMonth = count);
});
