document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('settings-form');
    const storageAPI = browser.storage || chrome.storage;

    // Pre-fill input fields with saved values
    storageAPI.local.get(['maxWords', 'maxSentences', 'maxParagraphs'], (result) => {
        document.getElementById('maxWords').value = result.maxWords || '';
        document.getElementById('maxSentences').value = result.maxSentences || '';
        document.getElementById('maxParagraphs').value = result.maxParagraphs || '';
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        let maxWords = document.getElementById('maxWords').value;
        let maxSentences = document.getElementById('maxSentences').value;
        let maxParagraphs = document.getElementById('maxParagraphs').value;

        // Save values to local storage
        await storageAPI.local.set({
            maxWords: maxWords,
            maxSentences: maxSentences,
            maxParagraphs: maxParagraphs
        });

        // Send message to content script with updated values
        const tabs = await (browser.tabs || chrome.tabs).query({ active: true, currentWindow: true });
        if (tabs?.[0]) {
            // Check if the tab URL matches chatgpt.com domain
            const url = tabs[0].url;
            if (url?.match(/^https:\/\/chatgpt\.com\/.*/)) {
                (browser.tabs || chrome.tabs).sendMessage(tabs[0].id, {
                    type: 'settingsUpdated',
                    settings: {
                        maxWords: maxWords,
                        maxSentences: maxSentences,
                        maxParagraphs: maxParagraphs
                    }
                });
            }
        }

        // Show saved message
        const saveButton = document.getElementById('saveButton');
        const originalText = saveButton.textContent;
        saveButton.textContent = 'Saved!';
        setTimeout(() => {
            saveButton.textContent = originalText;
        }, 1000);
    });
});