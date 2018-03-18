var R = require('ramda');

/**
 * { *   currentWindowId: windowId1,
 *   windowId1: {
        allTabs: [1234, 1233, ...];
 *      currentTabId: 1234,
 *      lastTabId: 12345,
 *      prevViewedTabs: [1234, 135, 892...]
 *      futureViewdTabs: [],
 *      jumpMode: true
 *   }
 * }
 */
var tabStorage = {};

function getAllTabs() {
    return tabStorage[tabStorage.currentWindowId].allTabs;
}

function clearAllFutureTabs() {
    tabStorage[tabStorage.currentWindowId].futureViewedTabs = [];
}

function getCurrentTabId() {
    return tabStorage[tabStorage.currentWindowId].currentTabId;
}

function updateCurrentTab(windowId, tabId){
    tabStorage.currentWindowId = windowId;
    if (tabStorage[windowId] == null) {
        initialCurrentWindow(windowId, tabId);
    }
    // update tab jump list
    if (tabStorage[windowId].currentTabId != tabId) {
        if (tabStorage[windowId].jumpMode) {
            tabStorage[windowId].jumpMode = false;
        } else if( tabStorage[windowId].prevViewedTabs.length == 0
            || tabStorage[windowId].currentTabId != getLastElementInList(tabStorage[windowId])) {
            tabStorage[windowId].prevViewedTabs.push(tabStorage[windowId].currentTabId);
            if (tabStorage[windowId].prevViewedTabs.length > 100) {
                tabStorage[windowId].prevViewedTabs.shift();
            }
        }
        tabStorage[windowId].lastTabId = tabStorage[windowId].currentTabId
        tabStorage[windowId].currentTabId = tabId;
    }
}

function getLastElementInList(l) {
    return getLastNthElementInList(l, 1)
}

function getLastNthElementInList(l, n) {
    return l[l.length-n]
}

function getAllTabsOfCurrentWindow(callback) {
    getAllTabsOfWindow(chrome.windows.WINDOW_ID_CURRENT, callback);
}

function getAllTabsOfWindow(windowId, callback) {
    chrome.tabs.query({windowId: windowId}, function(Tabs) {
        callback(Tabs);
    });
}

function updateAllTabs() {
    getAllTabsOfCurrentWindow(function(tabs){
        tabStorage[tabStorage.currentWindowId].allTabs = tabs;
    });
}

function initialCurrentWindow(windowId, tabId) {
    tabStorage.currentWindowId = windowId;
    if (tabStorage[windowId] == null) {
        tabStorage[windowId] = {};
        tabStorage[windowId].prevViewedTabs = [];
        tabStorage[windowId].futureViewedTabs = [];
        tabStorage[windowId].jumpMode = false;
    }
    if (tabId != undefined) {
        tabStorage[windowId].currentTabId = tabId;
        tabStorage[windowId].lastTabId = tabId;
    }
}

function getCurrentTab(tabCallback) {
    chrome.tabs.query(
        { currentWindow: true, active: true },
        function (tabArray) { tabCallback(tabArray[0]); }
    );
}

// Initialization
getCurrentTab((currentTab) => {
    initialCurrentWindow(currentTab.windowId, currentTab.id);
    updateAllTabs();
});

document.addEventListener('DOMContentLoaded', function(){
    // tabs event listener
    chrome.tabs.onCreated.addListener((tab) => {
        // destroy future viewed tab list
        clearAllFutureTabs();
    });

    chrome.tabs.onRemoved.addListener((tabId) => {
        // remove this tab id from jump list
        tabStorage[tabStorage.currentWindowId].prevViewedTabs = R.filter(
            (e) => e != tabId, tabStorage[tabStorage.currentWindowId].prevViewedTabs);
        tabStorage[tabStorage.currentWindowId].futureViewedTabs = R.filter(
            (e) => e != tabId, tabStorage[tabStorage.currentWindowId].futureViewedTabs);
        tabStorage[tabStorage.currentWindowId].jumpMode = true;
        updateAllTabs();
    });

    chrome.tabs.onUpdated.addListener(updateAllTabs);

    chrome.tabs.onMoved.addListener(updateAllTabs);

    chrome.tabs.onActivated.addListener((activeInfo) => {
        updateCurrentTab(activeInfo.windowId, activeInfo.tabId)});

    chrome.windows.onFocusChanged.addListener((windowId) => {
        initialCurrentWindow(windowId);
        updateAllTabs();
    });

    chrome.windows.onRemoved.addListener((windowId) => delete tabStorage[windowId])

    chrome.commands.onCommand.addListener(function(command) {
        if (command === "goto-last-viewed-tab") {
            var lastViewedTabId = tabStorage[tabStorage.currentWindowId].prevViewedTabs.pop();
            while (lastViewedTabId === tabStorage[tabStorage.currentWindowId].currentTabId) {
                lastViewedTabId = tabStorage[tabStorage.currentWindowId].prevViewedTabs.pop();
            }
            if (lastViewedTabId === undefined)
                return;
            tabStorage[tabStorage.currentWindowId].futureViewedTabs.push(
                tabStorage[tabStorage.currentWindowId].currentTabId);
            tabStorage[tabStorage.currentWindowId].jumpMode = true;
            chrome.tabs.update(lastViewedTabId , {active: true, highlighted:true});
        } else if (command === "goto-next-viewed-tab") {
            var nextViewedTabId = tabStorage[tabStorage.currentWindowId].futureViewedTabs.pop();
            while (nextViewedTabId === tabStorage[tabStorage.currentWindowId].futureViewedTabs) {
                nextViewedTabId = tabStorage[tabStorage.currentWindowId].futureViewedTabs.pop();
            }
            if (nextViewedTabId === undefined)
                return;
            tabStorage[tabStorage.currentWindowId].prevViewedTabs.push(
                tabStorage[tabStorage.currentWindowId].currentTabId);
            tabStorage[tabStorage.currentWindowId].jumpMode = true;
            chrome.tabs.update(nextViewedTabId, {active: true, highlighted:true});
        } else {
            // toggle between current tab and previous viewed tabs
            tabStorage[tabStorage.currentWindowId].jumpMode = true;
            chrome.tabs.update(tabStorage[tabStorage.currentWindowId].lastTabId, {active: true, highlighted:true});
        }
    });

    if (!window.getAllTabs){
        window.getAllTabs= getAllTabs;
    }
    if (!window.getAllTabsOfCurrentWindow){
        window.getAllTabsOfCurrentWindow = getAllTabsOfCurrentWindow;
    }
    if (!window.getCurrentTabId){
        window.getCurrentTabId = getCurrentTabId;
    }
    if (!window.clearAllFutureTabs){
        window.clearAllFutureTabs = clearAllFutureTabs;
    }
});
