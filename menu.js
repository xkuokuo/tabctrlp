var R = require('ramda');
var $ = require('jquery');

function getAllTabsOfCurrentWindow(callback) {
    getAllTabs(chrome.windows.WINDOW_ID_CURRENT, callback);
}

function getAllTabs(windowId, callback) {
    chrome.tabs.query({windowId: windowId}, function(Tabs) {
        callback(Tabs);
    });
}

function displayText(text) {
    document.getElementById('status').textContent = text;
}

function addTabEntry(Tab) {
    $('ul').append('<li><img class=".img-responsive" src=' + Tab.favIconUrl +'>' + Tab.title + '</li>')
}

document.addEventListener('DOMContentLoaded', function() {
    getAllTabsOfCurrentWindow(function(resultTabs){
        R.map(addTabEntry, resultTabs);
    });
});
