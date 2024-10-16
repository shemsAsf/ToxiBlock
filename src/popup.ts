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

document.addEventListener('DOMContentLoaded', () => {
    fetchCensorCount();
    fetchCensorCountFromAPI();
});
