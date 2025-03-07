document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('settings-form');
    const storageAPI = browser.storage || chrome.storage;

    // Pre-fill input fields with saved values
    storageAPI.local.get(['maxWords', 'maxSentences', 'maxParagraphs', 'onOff'], (result) => {
        document.getElementById('maxWords').value = result.maxWords || '';
        document.getElementById('maxSentences').value = result.maxSentences || '';
        document.getElementById('maxParagraphs').value = result.maxParagraphs || '';
        document.getElementById('onOff').checked = result.onOff === true || result.onOff === null;

        
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        let maxWords = document.getElementById('maxWords').value;
        let maxSentences = document.getElementById('maxSentences').value;
        let maxParagraphs = document.getElementById('maxParagraphs').value;
        let onOff = document.getElementById('onOff').checked;

        // Save values to local storage
        await storageAPI.local.set({
            maxWords: maxWords,
            maxSentences: maxSentences,
            maxParagraphs: maxParagraphs,
            onOff: onOff
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
                        maxParagraphs: maxParagraphs,
                        onOff: onOff
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