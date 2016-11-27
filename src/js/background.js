var R = require('ramda');

var allTabs = [];

function setAllTabs() {
    getAllTabsOfCurrentWindow(function(tabs){
        allTabs = tabs;
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

document.addEventListener('DOMContentLoaded', function(){
    console.log("Background loaded");
    chrome.tabs.onUpdated.addListener(setAllTabs);
    chrome.windows.onFocusChanged.addListener(setAllTabs);
    if (!window.getAllTabs){
        window.getAllTabs= getAllTabs;
    }
    if (!window.getAllTabsOfCurrentWindow){
        window.getAllTabsOfCurrentWindow = getAllTabsOfCurrentWindow;
    }
});

