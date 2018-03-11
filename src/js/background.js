var R = require('ramda');

var allTabs = [];

var currentTabIndex = 0;
var lastTabIndex = 0;

function setAllTabs() {
    getAllTabsOfCurrentWindow(function(tabs){
        allTabs = tabs;
    });
}

function getCurrentTabIndex(){
    return currentTabIndex;
}

function updateCurrentTabIndex(){
    lastTabIndex = currentTabIndex;
    chrome.tabs.getSelected((tab) => {
        //TODO: getSelected methos is deprecated. Replace it
        currentTabIndex = tab.index;
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

//preload
setAllTabs();

chrome.commands.onCommand.addListener(function(command) {
    console.log('Command:', command);
    var lastTabId = getAllTabs()[lastTabIndex].id
    chrome.tabs.update(lastTabId, {active: true, highlighted:true});
});

document.addEventListener('DOMContentLoaded', function(){
    console.log("Background loaded");

    chrome.tabs.onRemoved.addListener(setAllTabs);
    chrome.tabs.onUpdated.addListener(setAllTabs);
    chrome.tabs.onActivated.addListener(updateCurrentTabIndex);
    chrome.tabs.onHighlighted.addListener(updateCurrentTabIndex);
    chrome.windows.onFocusChanged.addListener(setAllTabs);

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
