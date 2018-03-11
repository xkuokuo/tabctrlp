var R = require('ramda');

var allTabs = [];

var currentTabIndex = 0;

var currentWindowId = 0;

/**
 * {
 *   windowId1: {
 *      currentTabId: 1234,
 *      lastTabId: 12345,
 *      prevViewedTabs: [1234, 135, 892...]
 *      futureViewdTabs: []
 *   },
 *   windowId2: {
 *      currentTabId: 2345,
 *      lastTabId: 234567
 *      prevViewedTabs: [2345]
 *      futureViewdTabs: [34]
 *   }
 * }
 */
var tabStorage = {};

function getCurrentTabIndex(){
    return currentTabIndex;
}

function updateCurrentTabInfo(){
    chrome.tabs.getSelected((tab) => {
        // TODO: getSelected methos is deprecated. Replace it
        currentWindowId = tab.windowId;
        currentTabIndex = tab.index;
        // update tab jump list
        if (tabStorage[tab.windowId].currentTabId != tab.id) {
            if (tabStorage[tab.windowId].jumpMode) {
                tabStorage[tab.windowId].jumpMode = false;
            } else {
                if(tabStorage[tab.windowId].currentTabId != getLastElementInList(tabStorage[tab.windowId]))
                    tabStorage[tab.windowId].prevViewedTabs.push(tabStorage[tab.windowId].currentTabId);
            }
            tabStorage[tab.windowId].lastTabId = tabStorage[tab.windowId].currentTabId
            tabStorage[tab.windowId].currentTabId = tab.id;
        }
    });
}

function getLastElementInList(l) {
    return getLastNthElementInList(l, 1)
}

function getLastNthElementInList(l, n) {
    return l[l.length-n]
}

function getAllTabs() {
    return allTabs;
}

function getAllTabsOfCurrentWindow(callback) {
    getAllTabsOfWindow(chrome.windows.WINDOW_ID_CURRENT, callback);
}

function getAllTabsOfWindow(windowId, callback) {
    chrome.tabs.query({windowId: windowId}, function(Tabs) {
        callback(Tabs);
    });
}

function loadAllTabs() {
    getAllTabsOfCurrentWindow(function(tabs){
        allTabs = tabs;
    });
}

function initialCurrentWindow() {
    getCurrentTab(function(tab) {
        currentWindowId = tab.windowId;
        tabStorage[tab.windowId] = {};
        tabStorage[tab.windowId].currentTabId = tab.id;
        tabStorage[tab.windowId].lastTabId = tab.id;
        tabStorage[tab.windowId].prevViewedTabs = [];
        tabStorage[tab.windowId].futureViewedTabs = [];
    });
}

function getCurrentTab(tabCallback) {
    chrome.tabs.query(
        { currentWindow: true, active: true },
        function (tabArray) { tabCallback(tabArray[0]); }
    );
}

// Initialization
loadAllTabs();
initialCurrentWindow();

document.addEventListener('DOMContentLoaded', function(){
    chrome.tabs.onCreated.addListener(() => {
        // destroy future viewed tab list
        tabStorage[currentWindowId].futureViewedTabs = [];
    });
    chrome.tabs.onRemoved.addListener((tabId) => {
        // remove this tab id from jump list
        tabStorage[currentWindowId].prevViewedTabs = R.filter(
            (e) => e != tabId,
            tabStorage[currentWindowId].prevViewedTabs);
        tabStorage[currentWindowId].futureViewedTabs = R.filter(
            (e) => e != tabId,
            tabStorage[currentWindowId].futureViewedTabs);

        tabStorage[currentWindowId].jumpMode = true;
        loadAllTabs(); });
    chrome.tabs.onUpdated.addListener(loadAllTabs);
    chrome.tabs.onActivated.addListener(updateCurrentTabInfo);
    chrome.tabs.onHighlighted.addListener(updateCurrentTabInfo);

    chrome.windows.onCreated.addListener(initialCurrentWindow);
    chrome.windows.onFocusChanged.addListener(loadAllTabs);
    chrome.windows.onFocusChanged.addListener(updateCurrentTabInfo);
    chrome.windows.onRemoved.addListener((windowId) => delete tabStorage[windowId])

    // toggle between current tab and previous viewed tabs
    chrome.commands.onCommand.addListener(function(command) {
        if (command === "goto-last-viewed-tab") {
            var lastViewedTabId = tabStorage[currentWindowId].prevViewedTabs.pop();
            if (lastViewedTabId === undefined)
                return;
            tabStorage[currentWindowId].futureViewedTabs.push(
                tabStorage[currentWindowId].currentTabId);
            tabStorage[currentWindowId].jumpMode = true;
            chrome.tabs.update(lastViewedTabId , {active: true, highlighted:true});
        } else if (command === "goto-next-viewed-tab") {
            var nextViewedTabId = tabStorage[currentWindowId].futureViewedTabs.pop();
            if (nextViewedTabId === undefined)
                return;
            tabStorage[currentWindowId].prevViewedTabs.push(
                tabStorage[currentWindowId].currentTabId);
            tabStorage[currentWindowId].jumpMode = true;
            chrome.tabs.update(nextViewedTabId, {active: true, highlighted:true});
        } else {
            tabStorage[currentWindowId].jumpMode = true;
            chrome.tabs.update(tabStorage[currentWindowId].lastTabId, {active: true, highlighted:true});
        }
    });


    if (!window.getAllTabs){
        window.getAllTabs= getAllTabs;
    }
    if (!window.getAllTabsOfCurrentWindow){
        window.getAllTabsOfCurrentWindow = getAllTabsOfCurrentWindow;
    }
    if (!window.getCurrentTabIndex){
        window.getCurrentTabIndex= getCurrentTabIndex;
    }
});
