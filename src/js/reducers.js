const R = require('ramda');
const combineReducers = require('redux').combineReducers;
const actions = require('./actions');
var textMatcher = require('./textMatcher');

var backgroundPage = chrome.extension.getBackgroundPage();

var initState = {
    inputText: '',
    allTabs: backgroundPage.getAllTabs(),
    matchedTabs: backgroundPage.getAllTabs(),
    selectedTabId: backgroundPage.getCurrentTabId()
}

class TabModel {
    constructor(props) {
        this.title = props.title;
        this.id = props.id;
        this.favIconUrl = props.favIconUrl;
        this.index = props.index;
    }
}

function jumpToTabReducer(state = initState, action) {
    switch (action.type){
        case actions.JUMP_TO_TAB:
            backgroundPage.clearAllFutureTabs();
            chrome.tabs.update(state.selectedTabId, {active: true, highlighted:true});
            return state;
        default:
            return state;
    }
}

function removeTabReducer(state = initState, action) {
    switch (action.type){
        case actions.REMOVE_TAB:
            //remove tab from all abs.
            var allTabs = R.filter((tab)=>{return tab.id!=action.id;}, state.allTabs);
            var matchedTabs = R.filter((tab)=>{return tab.id!=action.id;}, state.allTabs);
            //update matched tabs
            return Object.assign({}, state, {
                allTabs: allTabs,
                matchedTabs: matchedTabs
            });
        default:
            return state;
    }
}

function keyDownReducer(state = initState, action) {
    switch (action.type){
        case actions.KEY_DOWN:
            var selectedTabId = state.selectedTabId
            var selectedTabPos= R.findIndex((tab)=>{return tab.id === selectedTabId}, state.matchedTabs);
            var newPos = selectedTabPos;
            var selectedTabId = state.selectedTabId;
            if (action.keyCode == 38) {
                newPos = selectedTabPos -1;
                selectedTabPos = newPos<0 ? state.matchedTabs.length-1 : newPos;
            } else if (action.keyCode == 40) {
                newPos = selectedTabPos +1;
                selectedTabPos = newPos>=state.matchedTabs.length ? 0 : newPos;
            }
            selectedTabId = (state.matchedTabs.length > selectedTabPos)?state.matchedTabs[selectedTabPos].id:0;
            return Object.assign({}, state, {
                selectedTabId: selectedTabId
            });
        default:
            return state;
    }
}

function inputChangedReducer(state = initState, action) {
    switch (action.type){
        case actions.INPUT_CHANGED:
            var inputText = action.inputText;
            var allTabs = state.allTabs;
            var selectedTabId = state.selectedTabId;
            var selectedTabPos= R.findIndex((tab)=>{return tab.id === selectedTabId}, state.matchedTabs);
            if (inputText) {
                var matchedTabs = R.sort((tab1, tab2) => {
                        let markCount = countMarkTag(tab1.title) - countMarkTag(tab2.title)
                        if (markCount != 0) {
                            return markCount;
                        } else {
                            return tab1.title.indexOf('<mark>') - tab2.title.indexOf('<mark>');
                        }
                    },
                    R.filter((tab) => ifContainsMarkup(tab.title),
                        R.map((tab) => ( new TabModel({title: addMarkups(inputText, tab.title), id: tab.id, index: tab.index, favIconUrl: tab.favIconUrl})),
                            R.map((tab) => new TabModel({title: tab.title, favIconUrl: tab.favIconUrl, id: tab.id, index: tab.index}),
                                allTabs))));
                selectedTabPos = 0;
            } else {
                matchedTabs = R.map((tab) => new TabModel({title: tab.title, favIconUrl: tab.favIconUrl, id: tab.id, index: tab.index}), allTabs);
            }
            selectedTabId = (matchedTabs.length>selectedTabPos)?matchedTabs[selectedTabPos].id:0
            return Object.assign({}, state, {
                inputText: inputText,
                matchedTabs: matchedTabs,
                selectedTabId: selectedTabId
            });
        default:
            return state;
    }
}

function addMarkups(pattern, testStr) {
    return textMatcher.addMarkups(pattern, testStr);
}

function ifContainsMarkup (str) {
    return str.indexOf('<mark>') >= 0;
}

function countMarkTag(str) {
    if (str)
        return (str.match(/<mark>/g)||[]).length;
    else
        return 0;
}

function mouseHoveredReducer (state = initState, action){
    switch (action.type){
        case actions.MOUSE_HOVERED:
            var selectedTabId = action.id;
            var selectedTabPos = R.findIndex((tab)=>{return tab.id === selectedTabId}, state.matchedTabs);
            return Object.assign({}, state, {
                selectedTabId: selectedTabId
            });
        default:
            return state;
    }
}

const appReducer = (state = initState, action ) => {
    var new_state = jumpToTabReducer(removeTabReducer(inputChangedReducer(mouseHoveredReducer(keyDownReducer(state, action),action),action),action),action)
    return new_state;
}

module.exports = appReducer;
