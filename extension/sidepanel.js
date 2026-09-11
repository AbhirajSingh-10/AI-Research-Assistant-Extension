let themeToggle;
let currentResult = "";
let currentYoutubeVideoId = null;

const helpers = window.ResearchHelpers || {
    extractYoutubeVideoId: null,
    getApiErrorMessage: (error, fallbackMessage) => fallbackMessage || 'Something went wrong.',
    getApiBaseUrl: () => 'http://localhost:8080',
    copyText: async (value) => {
        if (!navigator || !navigator.clipboard) {
            throw new Error('Clipboard unavailable.');
        }

        await navigator.clipboard.writeText(value);
    },
    canonicalizeYoutubeUrl: (url) => url || ''
};

function getApiUrl(path) {
    const baseUrl = helpers.getApiBaseUrl();
    return `${baseUrl.replace(/\/+$/, '')}${path}`;
}


/* =========================
   INITIALIZATION
   ========================= */

document.addEventListener("DOMContentLoaded", () => {

    loadNotes();
    autoDetectCurrentYoutubeUrl();

    // Research actions
    document
        .getElementById("summarizeBtn")
        ?.addEventListener("click", () => {
            processSelection("SUMMARIZE");
        });

    document
        .getElementById("explainBtn")
        ?.addEventListener("click", () => {
            processSelection("EXPLAIN");
        });

    document
        .getElementById("suggestBtn")
        ?.addEventListener("click", () => {
            processSelection("SUGGEST");
        });

    document
        .getElementById("keyPointsBtn")
        ?.addEventListener("click", () => {
            processSelection("KEY_POINTS");
        });

    document
        .getElementById("notesBtn")
        ?.addEventListener("click", () => {
            processSelection("GENERATE_NOTES");
        });

    // Notes
    document
        .getElementById("saveNotesBtn")
        ?.addEventListener("click", saveNotes);

    // Copy result
    document
        .getElementById("copyResultBtn")
        ?.addEventListener("click", copyResult);

    // YouTube
    const youtubeInput =
        document.getElementById("youtubeUrl");

    youtubeInput?.addEventListener("input", () => {
        const url = youtubeInput.value.trim();

        if (!url) {
            showYoutubeStatus("", "");
            return;
        }

        const detectedVideoId = helpers.extractYoutubeVideoId
            ? helpers.extractYoutubeVideoId(url)
            : extractYoutubeVideoId(url);

        if (detectedVideoId) {
            const normalizedUrl = helpers.canonicalizeYoutubeUrl
                ? helpers.canonicalizeYoutubeUrl(url)
                : url;

            if (normalizedUrl && normalizedUrl !== url) {
                youtubeInput.value = normalizedUrl;
            }

            showYoutubeStatus("YouTube video detected. Click Analyze to index it.", "success");
        } else {
            showYoutubeStatus("", "");
        }
    });

    youtubeInput?.addEventListener("paste", () => {
        setTimeout(() => {
            const url = youtubeInput.value.trim();
            const detectedVideoId = helpers.extractYoutubeVideoId
                ? helpers.extractYoutubeVideoId(url)
                : extractYoutubeVideoId(url);

            if (detectedVideoId) {
                youtubeInput.value = helpers.canonicalizeYoutubeUrl
                    ? helpers.canonicalizeYoutubeUrl(url)
                    : url;
                showYoutubeStatus("YouTube video detected. Click Analyze to index it.", "success");
            }
        }, 50);
    });

    document
        .getElementById("indexYoutubeBtn")
        ?.addEventListener(
            "click",
            indexYoutubeVideo
        );

    document
        .getElementById("askYoutubeBtn")
        ?.addEventListener(
            "click",
            askYoutubeQuestion
        );

    // Theme
    initializeTheme();
});


/* =========================
   NOTES
   ========================= */

function autoDetectCurrentYoutubeUrl() {
    const youtubeInput = document.getElementById("youtubeUrl");

    if (!youtubeInput || !chrome?.tabs) {
        return;
    }

    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, (tabs) => {
        if (!tabs || !tabs[0]) {
            return;
        }

        const activeUrl = tabs[0].url || "";
        const detectedVideoId = helpers.extractYoutubeVideoId
            ? helpers.extractYoutubeVideoId(activeUrl)
            : extractYoutubeVideoId(activeUrl);

        if (!detectedVideoId) {
            return;
        }

        const normalizedUrl = helpers.canonicalizeYoutubeUrl
            ? helpers.canonicalizeYoutubeUrl(activeUrl)
            : activeUrl;

        youtubeInput.value = normalizedUrl;
        showYoutubeStatus("YouTube video detected from the current tab.", "success");
    });
}


function loadNotes() {

    chrome.storage.local.get(
        ["researchNotes"],
        (result) => {

            const notesElement =
                document.getElementById("notes");

            if (
                notesElement &&
                result.researchNotes
            ) {
                notesElement.value =
                    result.researchNotes;
            }
        }
    );
}


function saveNotes() {

    const notes =
        document.getElementById("notes").value;

    chrome.storage.local.set(
        {
            researchNotes: notes
        },
        () => {

            const status =
                document.getElementById(
                    "saveStatus"
                );

            if (!status) {
                return;
            }

            status.textContent =
                "✓ Notes saved";

            setTimeout(() => {
                status.textContent = "";
            }, 2000);
        }
    );
}


/* =========================
   THEME
   ========================= */

function initializeTheme() {

    themeToggle =
        document.getElementById("themeToggle");

    if (!themeToggle) {
        return;
    }

    const savedTheme =
        localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add(
            "dark-mode"
        );
    }

    updateThemeButton();

    themeToggle.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "dark-mode"
            );

            const isDark =
                document.body.classList.contains(
                    "dark-mode"
                );

            localStorage.setItem(
                "theme",
                isDark ? "dark" : "light"
            );

            updateThemeButton();
        }
    );
}


function updateThemeButton() {

    if (!themeToggle) {
        return;
    }

    const isDark =
        document.body.classList.contains(
            "dark-mode"
        );

    themeToggle.textContent =
        isDark ? "☀️" : "🌙";

    themeToggle.title =
        isDark
            ? "Switch to Light Mode"
            : "Switch to Dark Mode";
}


/* =========================
   TEXT RESEARCH
   ========================= */

async function processSelection(operation) {

    const buttons =
        document.querySelectorAll(
            ".action-button"
        );

    try {

        setButtonsDisabled(
            buttons,
            true
        );

        const [tab] =
            await chrome.tabs.query({
                active: true,
                currentWindow: true
            });

        if (!tab || !tab.id) {
            throw new Error(
                "Unable to access the current tab."
            );
        }

        const [{ result }] =
            await chrome.scripting.executeScript({

                target: {
                    tabId: tab.id
                },

                function: () =>
                    window
                        .getSelection()
                        .toString()
            });

        if (!result || !result.trim()) {

            showError(
                "Please select some text on the webpage first."
            );

            return;
        }

        showLoading();

        const response =
            await fetch(
                getApiUrl("/api/research/process"),
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        content: result,
                        operation: operation
                    })
                }
            );

        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                errorText ||
                `API Error: ${response.status}`
            );
        }

        const text =
            await response.text();

        currentResult = text;

        showResult(text);

    } catch (error) {

        console.error(
            "Research failed:",
            error
        );

        showError(
            helpers.getApiErrorMessage(
                error,
                error && error.message
                    ? error.message
                    : "Something went wrong."
            )
        );

    } finally {

        setButtonsDisabled(
            buttons,
            false
        );
    }
}


/* =========================
   RESULT UI
   ========================= */

function showLoading() {

    const results =
        document.getElementById("results");

    results.className = "results";

    results.innerHTML = `
        <div class="loading">
            <span class="loading-spinner"></span>
            <span>Researching...</span>
        </div>
    `;
}


function showResult(content) {

    const results =
        document.getElementById("results");

    results.className = "results";

    results.innerHTML = "";

    const resultItem =
        document.createElement("div");

    resultItem.className =
        "result-item";

    const resultContent =
        document.createElement("div");

    resultContent.className =
        "result-content";

    /*
     * Use textContent instead of innerHTML
     * because model output may contain
     * arbitrary content.
     */

    resultContent.textContent =
        content;

    resultItem.appendChild(
        resultContent
    );

    results.appendChild(
        resultItem
    );
}


function showError(message) {

    const results =
        document.getElementById("results");

    results.className =
        "results";

    results.innerHTML = "";

    const resultItem =
        document.createElement("div");

    resultItem.className =
        "result-item";

    const resultContent =
        document.createElement("div");

    resultContent.className =
        "result-content";

    resultContent.textContent =
        `⚠️ ${message}`;

    resultItem.appendChild(
        resultContent
    );

    results.appendChild(
        resultItem
    );
}


/* =========================
   COPY RESULT
   ========================= */

async function copyResult() {

    if (!currentResult) {
        return;
    }

    try {

        await helpers.copyText(currentResult);

        const button =
            document.getElementById(
                "copyResultBtn"
            );

        if (!button) {
            return;
        }

        const originalText =
            button.textContent;

        button.textContent =
            "Copied";

        setTimeout(() => {

            button.textContent =
                originalText;

        }, 1500);

    } catch (error) {

        console.error(
            "Failed to copy result:",
            error
        );

        showError("Unable to copy the result. Your browser blocked clipboard access.");
    }
}


/* =========================
   HELPERS
   ========================= */

function setButtonsDisabled(
    buttons,
    disabled
) {

    buttons.forEach(
        button => {
            button.disabled =
                disabled;
        }
    );
}


function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value;

    return div.innerHTML;
}


/* =========================
   YOUTUBE RESEARCH
   ========================= */

async function indexYoutubeVideo() {

    const input =
        document.getElementById(
            "youtubeUrl"
        );

    const button =
        document.getElementById(
            "indexYoutubeBtn"
        );

    const questionSection =
        document.getElementById(
            "youtubeQuestionSection"
        );

    if (!input || !button) {
        return;
    }

    const url =
        input.value.trim();

    /*
     * Validate URL
     */

    if (!url) {

        showYoutubeStatus(
            "Please enter a YouTube URL.",
            "error"
        );

        return;
    }

    const videoId =
        helpers.extractYoutubeVideoId
            ? helpers.extractYoutubeVideoId(url)
            : extractYoutubeVideoId(url);

    if (!videoId) {

        showYoutubeStatus(
            "Please enter a valid YouTube URL.",
            "error"
        );

        return;
    }

    /*
     * Disable button while indexing
     */

    const normalizedUrl =
        helpers.canonicalizeYoutubeUrl
            ? helpers.canonicalizeYoutubeUrl(url)
            : url;

    if (normalizedUrl && normalizedUrl !== url) {
        input.value = normalizedUrl;
    }

    button.disabled = true;

    button.textContent =
        "Analyzing...";

    if (questionSection) {

        questionSection.classList.add(
            "hidden"
        );
    }

    showYoutubeStatus(
        "Extracting transcript and indexing video...",
        ""
    );

    try {

        const response =
            await fetch(
                getApiUrl("/api/youtube/index"),
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        url: normalizedUrl || url
                    })
                }
            );

        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                errorText ||
                `API Error: ${response.status}`
            );
        }

        const message =
            await response.text();

        console.log(
            "YouTube indexing:",
            message
        );

        /*
         * Only mark the video as active
         * after successful indexing.
         */

        currentYoutubeVideoId =
            videoId;

        showYoutubeStatus(
            "✓ Transcript indexed successfully.",
            "success"
        );

        if (questionSection) {

            questionSection.classList.remove(
                "hidden"
            );
        }

    } catch (error) {

        console.error(
            "YouTube indexing failed:",
            error
        );

        currentYoutubeVideoId =
            null;

        showYoutubeStatus(
            helpers.getApiErrorMessage(
                error,
                error && error.message
                    ? error.message
                    : "Failed to index the YouTube video."
            ),
            "error"
        );

    } finally {

        button.disabled = false;

        button.textContent =
            "Analyze";
    }
}


/* =========================
   ASK YOUTUBE QUESTION
   ========================= */

async function askYoutubeQuestion() {

    const questionInput =
        document.getElementById(
            "youtubeQuestion"
        );

    const button =
        document.getElementById(
            "askYoutubeBtn"
        );

    if (!questionInput || !button) {
        return;
    }

    const question =
        questionInput.value.trim();

    /*
     * Make sure a video has been indexed.
     */

    if (!currentYoutubeVideoId) {

        showYoutubeStatus(
            "Please analyze a YouTube video first.",
            "error"
        );

        return;
    }

    /*
     * Validate question.
     */

    if (!question) {

        showYoutubeStatus(
            "Please enter a question.",
            "error"
        );

        return;
    }

    button.disabled = true;

    button.textContent =
        "Asking...";

    showLoading();

    try {

        const response =
            await fetch(
                getApiUrl("/api/youtube/ask"),
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        videoId:
                            currentYoutubeVideoId,

                        question:
                            question
                    })
                }
            );

        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                errorText ||
                `API Error: ${response.status}`
            );
        }

        const data =
            await response.json();

        console.log(
            "YouTube RAG response:",
            data
        );

        /*
         * Backend response:
         *
         * {
         *   answer: "...",
         *   sourceList: [
         *      {
         *          start: 12.5,
         *          duration: 8.2,
         *          text: "..."
         *      }
         *   ]
         * }
         */

        currentResult =
            data.answer || "";

        showYoutubeAnswer(
            data.answer || "",
            data.sourceList || []
        );

    } catch (error) {

        console.error(
            "YouTube question failed:",
            error
        );

        showError(
            helpers.getApiErrorMessage(
                error,
                error && error.message
                    ? error.message
                    : "Failed to get an answer."
            )
        );

    } finally {

        button.disabled = false;

        button.textContent =
            "Ask";
    }
}


/* =========================
   YOUTUBE ANSWER UI
   ========================= */

function showYoutubeAnswer(
    answer,
    sources
) {

    const results =
        document.getElementById(
            "results"
        );

    results.className =
        "results";

    results.innerHTML = "";

    /*
     * ANSWER
     */

    const answerContainer =
        document.createElement("div");

    answerContainer.className =
        "youtube-answer";

    const answerTitle =
        document.createElement("div");

    answerTitle.className =
        "response-label";

    answerTitle.textContent =
        "Answer";

    const answerContent =
        document.createElement("div");

    answerContent.className =
        "result-content";

    /*
     * AI output is inserted using
     * textContent for safety.
     */

    answerContent.textContent =
        answer;

    answerContainer.appendChild(
        answerTitle
    );

    answerContainer.appendChild(
        answerContent
    );

    results.appendChild(
        answerContainer
    );


    /*
     * SOURCES
     */

    if (
        Array.isArray(sources) &&
        sources.length > 0
    ) {

        const sourcesContainer =
            document.createElement("div");

        sourcesContainer.className =
            "youtube-sources";

        const sourcesTitle =
            document.createElement("div");

        sourcesTitle.className =
            "response-label";

        sourcesTitle.textContent =
            "Sources";

        sourcesContainer.appendChild(
            sourcesTitle
        );


        sources.forEach(
            (source, index) => {

                const sourceElement =
                    document.createElement(
                        "div"
                    );

                sourceElement.className =
                    "source-item";

                const timestamp =
                    formatTimestamp(
                        source.start
                    );

                /*
                 * Create source header
                 */

                const sourceHeader =
                    document.createElement(
                        "div"
                    );

                sourceHeader.className =
                    "source-header";

                const sourceNumber =
                    document.createElement(
                        "span"
                    );

                sourceNumber.className =
                    "source-number";

                sourceNumber.textContent =
                    index + 1;

                const sourceTime =
                    document.createElement(
                        "span"
                    );

                sourceTime.className =
                    "source-time";

                sourceTime.textContent =
                    timestamp;

                sourceHeader.appendChild(
                    sourceNumber
                );

                sourceHeader.appendChild(
                    sourceTime
                );


                /*
                 * Create source text
                 */

                const sourceText =
                    document.createElement(
                        "div"
                    );

                sourceText.className =
                    "source-text";

                sourceText.textContent =
                    source.text || "";


                /*
                 * Add everything
                 */

                sourceElement.appendChild(
                    sourceHeader
                );

                sourceElement.appendChild(
                    sourceText
                );

                sourcesContainer.appendChild(
                    sourceElement
                );
            }
        );

        results.appendChild(
            sourcesContainer
        );
    }
}


/* =========================
   YOUTUBE TIMESTAMP
   ========================= */

function formatTimestamp(seconds) {

    const totalSeconds =
        Math.floor(
            Number(seconds) || 0
        );

    const hours =
        Math.floor(
            totalSeconds / 3600
        );

    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );

    const remainingSeconds =
        totalSeconds % 60;

    /*
     * If video is longer than one hour:
     *
     * 1:05:32
     *
     * Otherwise:
     *
     * 5:32
     */

    if (hours > 0) {

        return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
    }

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}


/* =========================
   EXTRACT YOUTUBE VIDEO ID
   ========================= */

function extractYoutubeVideoId(url) {
    if (typeof url !== "string") {
        return null;
    }

    const trimmed = url.trim();

    if (!trimmed) {
        return null;
    }

    if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) {
        return trimmed;
    }

    const match = trimmed.match(/(?:v=|\/shorts\/|\/embed\/|\/live\/|youtu\.be\/|\/watch\?v=)([A-Za-z0-9_-]{11})/i);

    if (match && match[1]) {
        return match[1];
    }

    try {
        let urlToParse = trimmed;

        if (!/^https?:\/\//i.test(urlToParse)) {
            urlToParse = `https://${urlToParse}`;
        }

        const parsedUrl = new URL(urlToParse);
        const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");

        if (
            hostname === "youtube.com" ||
            hostname === "m.youtube.com" ||
            hostname === "music.youtube.com" ||
            hostname === "youtube-nocookie.com"
        ) {
            const videoId = parsedUrl.searchParams.get("v");

            if (videoId) {
                return videoId;
            }

            const shortMatch = parsedUrl.pathname.match(/\/(?:shorts|embed|live|v)\/([^/?]+)/i);

            if (shortMatch && shortMatch[1]) {
                return shortMatch[1];
            }
        }

        if (hostname === "youtu.be") {
            const videoId = parsedUrl.pathname.replace(/^\//, "").split("/")[0];
            return videoId || null;
        }

        return null;
    } catch (error) {
        console.error("Invalid YouTube URL:", error);
        return null;
    }
}


/* =========================
   YOUTUBE STATUS
   ========================= */

function showYoutubeStatus(
    message,
    type
) {

    const status =
        document.getElementById(
            "youtubeStatus"
        );

    if (!status) {
        return;
    }

    status.textContent =
        message;

    status.className =
        "youtube-status";

    if (type) {

        status.classList.add(
            type
        );
    }
}