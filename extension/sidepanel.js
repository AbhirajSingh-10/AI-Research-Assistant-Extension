let themeToggle;


document.addEventListener('DOMContentLoaded', () => {

    chrome.storage.local.get(['researchNotes'], function(result) {
        const notesElement = document.getElementById('notes');
        if (notesElement && result.researchNotes) {
            notesElement.value = result.researchNotes;
        } 
    });


    document.getElementById('summarizeBtn')?.addEventListener('click', () => processSelection('SUMMARIZE'));
    document.getElementById('explainBtn')?.addEventListener('click', () => processSelection('EXPLAIN'));
    document.getElementById('suggestBtn')?.addEventListener('click', () => processSelection('SUGGEST'));
    document.getElementById('keyPointsBtn')?.addEventListener('click', () => processSelection('KEY_POINTS'));
    document.getElementById('notesBtn')?.addEventListener('click', () => processSelection('GENERATE_NOTES'));
    document.getElementById('saveNotesBtn')?.addEventListener('click', saveNotes);

    initializeTheme();
});

function initializeTheme(){
    themeToggle = document.getElementById("themeToggle");

    const tooltip = document.querySelector(".tooltip");

    if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    }

    updateThemeButton();

    // Toggle theme
    themeToggle.addEventListener("click", () => {

        document.body.classList.toggle("dark-mode");

        if (document.body.classList.contains("dark-mode")) {
            localStorage.setItem("theme", "dark");
        } else {
            localStorage.setItem("theme", "light");
        }

        updateThemeButton();
    });
}

async function processSelection(operation) {

    try {

        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        const [{ result }] =
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => window.getSelection().toString()
            });

        if (!result || !result.trim()) {
            showResult('Please select some text first');
            return;
        }

        showResult('Processing...');

        const response = await fetch(
            'http://localhost:8080/api/research/process',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: result,
                    operation: operation
                })
            }
        );

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const text = await response.text();

        showResult(text.replace(/\n/g, '<br>'));

    } catch (error) {

        showResult(
            'Error: ' + error.message
        );
    }
}


async function saveNotes() {
    const notes = document.getElementById('notes').value;
    chrome.storage.local.set({ 'researchNotes': notes}, function() {
        alert('Notes saved successfully');
    });
}


function showResult(content) {
    document.getElementById('results').innerHTML = `<div class="result-item"><div class="result-content">${content}</div></div>`;
}

function updateThemeButton() {
    const tooltip = document.querySelector(".tooltip");
    
    if (document.body.classList.contains("dark-mode")) {
        themeToggle.textContent = "☀️";
        tooltip.textContent = "Switch to Light Mode";
    } else {
        themeToggle.textContent = "🌙";
        tooltip.textContent = "Switch to Dark Mode";
    }
}