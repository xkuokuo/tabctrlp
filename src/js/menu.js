var R = require('ramda');
var $ = require('jquery');

var currentTabIndex = 0;
chrome.tabs.getSelected(function(tab){
    //TODO: getSelected methos is deprecated. Replace it
    currentTabIndex = tab.index;
});

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
    $('ul').append(createTabEntry(Tab));
}

function createTabEntry(Tab) {
    var entry = $('<li></li>');
    entry.addClass('clearfix');
    if (Tab.index == currentTabIndex) {
        entry.addClass('tab-selected');
    }
    var favIcon = $('<img class="img-responsive pull-left" src=' + Tab.favIconUrl + '>');
    var tabTitle = $('<p></p>')
    var tabID = $('<p></p>')
    tabID.text(Tab.id);
    tabID.addClass('tabID');
    tabID.addClass('hidden');
    tabTitle.text(Tab.title);
    entry.append(favIcon);
    entry.append(tabTitle);
    entry.append(tabID);
    return entry;
}

function moveUp() {
    var currentSelected = $('.tab-selected');
    var newSelected = currentSelected.prev('li');
    if (newSelected.length == 1) {
        newSelected.addClass('tab-selected');
        currentSelected.removeClass('tab-selected');
    }
}

function moveDown() {
    var currentSelected = $('.tab-selected');
    var newSelected = currentSelected.next('li');
    if (newSelected.length == 1) {
        newSelected.addClass('tab-selected');
        currentSelected.removeClass('tab-selected');
    }
}

function getSelectedTabID() {
    return  Number($.trim($('.tab-selected .tabID').text()));
}

//Bind the Up and Down button
$(document).keydown(function(e){
    if (e.keyCode == 38) {
        moveUp();
    }else if (e.keyCode == 40) {
        moveDown();
    }else if (e.keyCode == 13) {
        //alert("Tab" + getSelectedTabID() + "selected")
        chrome.tabs.update(getSelectedTabID(), {active: true, highlighted:true});
        //$('ul').append('<div>'+getSelectedTabID()+'</div>');
    }
})

//Display all tabs
document.addEventListener('DOMContentLoaded', function() {
    getAllTabsOfCurrentWindow(function(resultTabs){
        R.map(addTabEntry, resultTabs);
    });
});
