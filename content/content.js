// Store references to event listeners so we can remove them
let currentButton = null;
let currentTextarea = null;
let clickHandlerCapture = null;
let inputHandler = null;
let settings = {};

function setupButtonListener() {
    const button = document.querySelector("button[data-testid='send-button']");
    const textarea = document.querySelector("#prompt-textarea");

    // Clean up previous listeners if they exist
    removeExistingListeners();

    if (button && textarea) {
        currentButton = button;
        currentTextarea = textarea;

        clickHandlerCapture = async (event) => await handleButtonClick(event, textarea);
        inputHandler = async (event) => await handleInput(event);

        button.addEventListener("click", clickHandlerCapture, true);
        textarea.addEventListener('keydown', inputHandler, true);
    } else {
        // Try again later if elements aren't found
        setTimeout(setupButtonListener, 1000);
    }
}

async function handleInput(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        await addInstructionsToPrompt(event.target);
    }
}

async function handleButtonClick(event, textarea) {
    await addInstructionsToPrompt(textarea);
}

async function addInstructionsToPrompt(textarea) {
    if (checkSettingsExist(settings)) {
        // Add new lines at the end of the prompt, before adding the instructions
        simulateShiftEnter();
        simulateShiftEnter();

        const pElements = textarea.querySelectorAll('p');
        const pElement = pElements && pElements.length > 0 ? pElements[pElements.length - 1] : null;

        if (pElement) {
            pElement.textContent += formatSettings(settings);
        } else {
            console.error("ShortGPT: Could not find the prompt element. The website may have changed. Please, report this issue.");
        }
    }
}

function simulateShiftEnter() {
    // Create a keyboard event for Shift+Enter
    const shiftEnterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        shiftKey: true,
        bubbles: true,
        cancelable: true
    });

    // Dispatch the event on the textarea
    currentTextarea.dispatchEvent(shiftEnterEvent);
}

function checkSettingsExist(settings) {
    return settings && (settings.maxWords || settings.maxSentences || settings.maxParagraphs);
}

function formatSettings(settings) {
    if (checkSettingsExist(settings)) {
        let str = "";
        if (settings.maxWords >= 1)
            str += `Do not use more than ${settings.maxWords} words in your answer. `;
        if (settings.maxSentences >= 1)
            str += `Do not use more than ${settings.maxSentences} sentences in your answer. `;
        if (settings.maxParagraphs >= 1)
            str += `Do not use more than ${settings.maxParagraphs} paragraphs in your answer. `;
        return str;
    }
    else {
        return "";
    }
}

async function loadSettingsFromLocalStorage() {
    const storageAPI = browser.storage || chrome.storage;
    if (!storageAPI) {
        console.error('ShortGPT: Storage API is not available.');
        return;
    }

    const result = await new Promise((resolve) => {
        storageAPI.local.get(['maxWords', 'maxSentences', 'maxParagraphs'], (result) => {
            resolve(result);
        });
    });

    settings = {
        maxWords: result.maxWords || 0,
        maxSentences: result.maxSentences || 0,
        maxParagraphs: result.maxParagraphs || 0
    };
}

function removeExistingListeners() {
    if (currentButton && clickHandlerCapture) {
        currentButton.removeEventListener("click", clickHandlerCapture, true);
    }

    if (currentTextarea && inputHandler) {
        currentTextarea.removeEventListener('keydown', inputHandler, true);
    }

    currentButton = null;
    currentTextarea = null;
    clickHandlerCapture = null;
    inputHandler = null;
}

// Initial setup
setupButtonListener();
loadSettingsFromLocalStorage();

// Additional listener for dynamic content changes
const bodyObserver = new MutationObserver(() => {
    setupButtonListener();
});
bodyObserver.observe(document.body, { childList: true, subtree: true });

// Listen for settings updates
(browser.runtime || chrome.runtime).onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'settingsUpdated') {
        settings = {
            maxWords: message.settings.maxWords || 0,
            maxSentences: message.settings.maxSentences || 0,
            maxParagraphs: message.settings.maxParagraphs || 0
        };
    }
    return true;
});