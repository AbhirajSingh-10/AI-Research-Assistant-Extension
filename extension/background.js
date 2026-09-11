try {
    if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
        chrome.sidePanel.setPanelBehavior({
            openPanelOnActionClick: true
        });
    }
} catch (error) {
    console.warn('Side panel behavior is unavailable in this browser:', error);
}