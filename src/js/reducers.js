const R = require('ramda');
const combineReducers = require('redux').combineReducers;
const actions = require('./actions');
var chineseMatcher = require('./chineseMatcher');
var englishMatcher = require('./englishMatcher');

/*
  state definition
  {
    allTabs: []
    matchedTabs: []
    inputText: ''
    currentTabIndex: num
    selectedTabPos: num
    selectedTabId: num
  }
*/

var backgroundPage = chrome.extension.getBackgroundPage();
var initState = {
    inputText: '',
    allTabs: backgroundPage.getAllTabs(),
    matchedTabs: backgroundPage.getAllTabs(),
    currentTabIndex: backgroundPage.getCurrentTabIndex(),
    selectedTabPos: backgroundPage.getCurrentTabIndex(),
    selectedTabId: backgroundPage.getAllTabs()[backgroundPage.getCurrentTabIndex()].id
}

function jumpToTabReducer(state = initState, action) {
    switch (action.type){
        case actions.JUMP_TO_TAB:
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
            var selectedTabPos= state.selectedTabPos;
            var newPos = selectedTabPos;
            var selectedTabId = state.selectedTabId;
            if (e.keyCode == 38) {
                newPos = selectedTabPos -1;
                selectedTabPos = newPos<0 ? state.matchedTabs.length-1 : newPos;
            } else if (e.keyCode == 40) {
                newPos = selectedTabPos +1;
                selectedTabPos = newPos>=state.matchedTabs.length ? 0 : newPos;
            }
            selectedTabId = state.matchedTabs[selectedTabPos].id;
            return Object.assign({}, state, {
                selectedTabPos: selectedTabPos,
                selectedTabId: selectedTabId
            });
        default:
            return state;
    }
}

function inputChangedReducer(state = initState, action) {
    switch (action.type){
        case actions.INPUT_CHANEGED:
            var inputText = state.inputText;
            var allTabs = state.allTabs;
            var selectedTabPos = state.selectedTabPos;
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
                selectedTabPos = state.currentTabIndex;
            }
            return Object.assign({}, state, {
                matchedTabs: matchedTabs,
                selectedTabPos: selectedTabPos,
                selectedTabId: (matchedTabs.lenth>selectedTabPos)?matchedTabs[selectedTabPos].id:0
            });
        default:
            return state;
    }
}

function addMarkups(pattern, testStr) {
    if (chineseMatcher.containsChinese(testStr)) {
        return chineseMatcher.addMarkups(pattern, testStr);
    } else {
        return englishMatcher.addMarkups(pattern, testStr);
    }
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
            var selectedTabPos = R.findIndex((tab)=>{return tab.id===selectedTabId}, state.matchedTabs);
            return Object.assign({}, state, {
                selectedTabPos: selectedTabPos,
                selectedTabId: selectedTabId
            });
        default:
            return state;
    }
}


/*
const appReducer = combineReducers({
    removeTabReducer,
    inputChangedReducer,
    mouseHoveredReducer,
    keyDownReducer
})
*/
const appReducer = (state = initState, action ) => {
    console.log("Reducer?")
    console.log("Action")
    console.log(action)
    var new_state = removeTabReducer(inputChangedReducer(mouseHoveredReducer(keyDownReducer(state, action),action),action),action)
    console.log("new state?")
    console.log(new_state);
    return new_state;
}

module.exports = appReducer;
