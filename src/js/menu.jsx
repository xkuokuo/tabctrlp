var R = require('ramda');
var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');

function getAllTabsOfCurrentWindow(callback) {
    getAllTabs(chrome.windows.WINDOW_ID_CURRENT, callback);
}

function pickIndexes(indexes, arr){
    var res = [];
    for (let index of indexes){
        res.push(arr[index]);
    }
    return res;
}

function getAllTabs(windowId, callback) {
    chrome.tabs.query({windowId: windowId}, function(Tabs) {
        callback(Tabs);
    });
}

function containsUpperCase(str) {
    return str.toLowerCase() != str;
}

function addMarkup(pattern, testStr) {
    var res = '';
    var remaining = containsUpperCase(pattern) ? testStr : testStr.toLowerCase();
    var remainingOriginal = testStr;
    for (let char of pattern) {
        var pos = remaining.indexOf(char);
        if (pos <= -1) {
            //not a match
            return testStr;
        }
        //extract the unmarked part from the beginning and append to res
        //add markup around this position
        res = res + remainingOriginal.substring(0,pos) + '<mark>' + remainingOriginal.charAt(pos) + '</mark>';
        remaining = remaining.substring(pos + 1);
        remainingOriginal = remainingOriginal.substring(pos + 1);
    }
    res = res + remainingOriginal;
    return res;
}

function ifMatch(pattern, testStr) {
    if (containsUpperCase(pattern)) {
        return ifMatchCaseSensitive(pattern, testStr);
    } else {
        return ifMatchCaseSensitive(pattern, testStr.toLowerCase());
    }
}

function ifMatchCaseSensitive(pattern, testStr){
    var remaining = testStr
    for (let char of pattern) {
        var pos = remaining.indexOf(char);
        if (pos <= -1) {
            return false;
        }
        remaining = remaining.substring(pos);
    }
    return true;
}

class TabEntry extends React.Component {
    constructor(props) {
        super(props);
        this.jumpToTab = this.jumpToTab.bind(this);
        this.handleClick= this.handleClick.bind(this);
    }

    handleClick(event){
        this.jumpToTab(this.props.tab.id);
    }

    jumpToTab (tabID) {
        chrome.tabs.update(tabID, {active: true, highlighted:true});
    }

    render() {
        return (
            <li className={this.props.selected ? "clearFix tab-selected" : "clearFix"} onClick={this.handleClick}>
                <img className="img-responsive pull-left" src={this.props.tab.favIconUrl}/>
                <p className="tab-title" dangerouslySetInnerHTML={{__html: this.props.decorator(this.props.tab.title)}}></p>
                <p className="tabID hidden">{this.props.tab.id}</p>
            </li>);
    }
}

class TabsDisplay extends React.Component {
    render() {
        var tabEntrys =  R.map((tab) =>
            <TabEntry decorator={this.props.decorator} key={tab.id} tab={tab} selected={tab.index===this.props.selectedTabIndex?true:false}/>,
            pickIndexes(this.props.matchedTabsIndex, this.props.allTabs));
        return (
            <ul className="tab-list list-unstyled clear-fix">
                {tabEntrys}
            </ul>);
    }
}

//input display div box
class InputDisplay extends React.Component {
    render() {
        return <input type="text" className="input-display" value={this.props.inputText} onChange={this.props.onChange}/>;
    }
}

class App extends React.Component {
    constructor(props){
        super(props);
        this.state = {allTabs: [], matchedTabsIndex: [], selectedTabIndex: 0, inputText: '', matchedTitles: []};
        getAllTabsOfCurrentWindow((returnedTabs) => {
            this.setState({allTabs: returnedTabs});
            var curriedIfMatch = R.curry(ifMatch)('');
            var matchedTabsIndex = R.map((pair) => pair[1], R.filter((pair) => curriedIfMatch(pair[0]), R.addIndex(R.map)((tab, index) => [tab.title, index], returnedTabs)));
            this.setState({matchedTabsIndex: matchedTabsIndex});
        });
        chrome.tabs.getSelected((tab) => {
            //TODO: getSelected methos is deprecated. Replace it
            this.setState({selectedTabIndex: tab.index});
        });
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleInputChange= this.handleInputChange.bind(this);
        this.updateMatcher = this.updateMatcher.bind(this);
    }

    getSelectedTabID(){
        return this.state.allTabs[this.state.matchedTabsIndex[this.state.selectedTabIndex]].id;
    }

    moveDown(){
        this.setState((prevState, props) => {
            var newIndex = prevState.selectedTabIndex + 1;
            return {selectedTabIndex: newIndex>=this.state.matchedTabsIndex.length ? 0 : newIndex};
        });
    }

    moveUp(){
        this.setState((prevState, props) => {
            var newIndex = prevState.selectedTabIndex - 1;
            return {selectedTabIndex: newIndex<0 ? this.state.matchedTabsIndex.length-1 : newIndex};
        });
    }

    jumpToTab(tabID){
        chrome.tabs.update(tabID, {active: true, highlighted:true});
    }

    updateMatcher(inputText){
        var curriedIfMatch = R.curry(ifMatch)(inputText);
        var matchedTabsIndex = R.map((pair) => pair[1], R.filter((pair) => curriedIfMatch(pair[0]), R.addIndex(R.map)((tab, index) => [tab.title, index], this.state.allTabs)));
        this.setState({matchedTabsIndex: matchedTabsIndex});
        this.setState({selectedTabIndex: 0});
    }

    handleInputChange(e) {
        e.persist();
        this.updateMatcher(e.target.value);
        this.setState((prevState, props) => {
            return {inputText: e.target.value};
        });
    }

    handleKeyDown(e) {
        if (e.keyCode == 38) {
            this.moveUp();
        }else if (e.keyCode == 40) {
            this.moveDown();
        }else if (e.keyCode == 13) {
            this.jumpToTab(this.getSelectedTabID());
        }
    }

    render() {
        return (
            <div onKeyDown={this.handleKeyDown}>
                <InputDisplay tabIndex="0" inputText={this.state.inputText} onChange={this.handleInputChange}/>
                <TabsDisplay decorator={R.curry(addMarkup)(this.state.inputText)} allTabs={this.state.allTabs} matchedTabsIndex={this.state.matchedTabsIndex} selectedTabIndex={this.state.matchedTabsIndex[this.state.selectedTabIndex]}/>
            </div>);
    }
}

//Display all tabs
document.addEventListener('DOMContentLoaded', function() {
    ReactDOM.render(
        <App/>,
        document.getElementById('root')
    );
});
