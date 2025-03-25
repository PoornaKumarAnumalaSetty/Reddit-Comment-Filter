console.log("Content script running.");

let observer;

// Debounce function to prevent rapid calls to applyFiltering
let debounceTimeout;
const debounceDelay = 300; // Adjust delay as necessary

// Function to apply filtering with debounce
function debouncedApplyFiltering() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        applyFiltering();
    }, debounceDelay);
}

// Function to filter comments based on phrases or sentences in the dataset
function filterComments(dataset) {
    const commentElements = document.querySelectorAll('shreddit-comment div[id$="-post-rtjson-content"] p');
    console.log("Comment elements found: ", commentElements.length);

    commentElements.forEach(comment => {
        const commentText = comment.innerText.toLowerCase();
        console.log("Checking comment: ", commentText);

        let isFiltered = false;

        dataset.forEach(entry => {
            const phrase = entry.cleaned_content.toLowerCase();

            if (commentText.includes(phrase)) {
                console.log(`Found phrase "${phrase}" in comment.`);

                try {
                    // Filter comment based on sentiment_numeric
                    if (entry.sentiment_numeric === -1) {
                        comment.style.display = "none"; // Hide negative comment
                        console.log("Hiding negative comment: ", commentText);
                        isFiltered = true;
                    } else if (entry.sentiment_numeric === 0) {
                        comment.style.opacity = "0.5"; // Dim neutral comments
                        console.log("Dimming neutral comment: ", commentText);
                    }
                } catch (error) {
                    console.error("Error applying style to comment: ", error);
                }
            }
        });

        if (!isFiltered) {
            console.log("No negative phrases found for this comment.");
        }
    });
}

// Load dataset and apply filtering
function applyFiltering() {
    try {
        chrome.storage.local.get(['commentDataset'], (result) => {
            if (chrome.runtime.lastError) {
                console.error("Error accessing chrome.storage: ", chrome.runtime.lastError);
                return;
            }

            console.log("Retrieved dataset: ", result.commentDataset);
            if (result.commentDataset) {
                filterComments(result.commentDataset);
            } else {
                console.log("No dataset found.");
            }
        });
    } catch (error) {
        console.error("Error in applyFiltering: ", error);
    }
}

// Set up a MutationObserver to monitor new comments as the page loads dynamically
function startObserver() {
    observer = new MutationObserver(() => {
        console.log("DOM changed, checking for new comments...");
        try {
            debouncedApplyFiltering(); // Use the debounced function
        } catch (error) {
            console.error("Error re-applying filter after DOM change: ", error);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// Stop the observer
function stopObserver() {
    if (observer) {
        observer.disconnect();
        console.log("Observer disconnected.");
    }
}

// Listen for messages from the background script to stop the observer
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "stopObserver") {
        stopObserver();
        sendResponse({ success: true });
    }
});

// Initial run
applyFiltering(); // Initial filtering when the script runs

// Start observing changes
startObserver();
