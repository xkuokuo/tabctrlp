var R = require('ramda');

var allTabs = [];

var currentTabIndex = 0;

var currentWindowId = 0;

var tabStorage = {};


function getCurrentTabIndex(){
    return currentTabIndex;
}

function updateCurrentTabInfo(){
    chrome.tabs.getSelected((tab) => {
        //TODO: getSelected methos is deprecated. Replace it
        currentWindowId = tab.windowId;
        currentTabIndex = tab.index;
        if (!tabStorage[tab.windowId])
            tabStorage[tab.windowId] = {};
        if (tabStorage[tab.windowId].currentTabId != tab.id) {
            tabStorage[tab.windowId].lastTabId = tabStorage[tab.windowId].currentTabId
            tabStorage[tab.windowId].currentTabId = tab.id;
        }
    });
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

function initAllTabs() {
    getAllTabsOfCurrentWindow(function(tabs){
        allTabs = tabs;
    });
}

function doInCurrentTab(tabCallback) {
    chrome.tabs.query(
        { currentWindow: true, active: true },
        function (tabArray) { tabCallback(tabArray[0]); }
    );
}

//preload
initAllTabs();

doInCurrentTab(function(tab) {
    currentWindowId = tab.windowId;
    tabStorage[tab.windowId] = {};
    tabStorage[tab.windowId].currentTabId = tab.id;
    tabStorage[tab.windowId].lastTabId = tab.id;
});

document.addEventListener('DOMContentLoaded', function(){
    console.log("Background loaded");

    chrome.tabs.onRemoved.addListener(initAllTabs);
    chrome.tabs.onUpdated.addListener(initAllTabs);
    chrome.tabs.onActivated.addListener(updateCurrentTabInfo);
    chrome.tabs.onHighlighted.addListener(updateCurrentTabInfo);
    chrome.windows.onFocusChanged.addListener(initAllTabs);
    chrome.windows.onFocusChanged.addListener(updateCurrentTabInfo);
    // toggle between current tab and previous viewed tabs
    chrome.commands.onCommand.addListener(function(command) {
        chrome.tabs.update(tabStorage[currentWindowId].lastTabId, {active: true, highlighted:true});
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
