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

function ifMatch(pattern, testStr) {
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
    render() {
        return (
            <li className={this.props.selected ? "clearFix tab-selected" : "clearFix"}>
                <img className="img-responsive pull-left" src={this.props.tab.favIconUrl}/>
                <p className="tabTitle">{this.props.tab.title}</p>
                <p className="tabID hidden">{this.props.tab.id}</p>
            </li>);
    }
}

class TabsDisplay extends React.Component {
    constructor(props) {
        super(props)
        this.state = {allTabs: props.allTabs, matchedTabsIndex: props.matchedTabsIndex, selectedTabIndex: props.selectedTabIndex};
    }

    render() {
        var tabEntrys =  R.map((tab) =>
            <TabEntry key={tab.id} tab={tab} selected={tab.index===this.props.selectedTabIndex?true:false}/>,
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
        return <div className="input-display" >{this.props.inputText}</div>;
        //return <div className="input-display" tabIndex="0"></div>;
    }
}

class App extends React.Component {
    constructor(props){
        super(props);
        this.state = {allTabs: [], matchedTabsIndex: [], selectedTabIndex: 0, inputText: '', matchedTitles: []};
        getAllTabsOfCurrentWindow((returnedTabs) => {
            this.setState({allTabs: returnedTabs});
            var curriedIfMatch = R.curry(ifMatch)('');
            var matchedTabsIndex = R.map((pair) => pair[1], R.filter((pair) => curriedIfMatch(pair[0]), R.addIndex(R.map)((tab, index) => [((tab) => tab.title), index], returnedTabs)));
            this.setState({matchedTabsIndex: matchedTabsIndex});
        });
        chrome.tabs.getSelected((tab) => {
            //TODO: getSelected methos is deprecated. Replace it
            this.setState({selectedTabIndex: tab.index});
        });
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.updateMatcher = this.updateMatcher.bind(this);
    }

    getSelectedTabID(){
        return this.state.allTabs[this.state.selectedTabIndex].id;
    }

    moveDown(){
        this.setState((prevState, props) => {
            var newIndex = prevState.selectedTabIndex + 1;
            return {selectedTabIndex: newIndex>=this.state.allTabs.length ? 0 : newIndex};
        });
    }

    moveUp(){
        this.setState((prevState, props) => {
            var newIndex = prevState.selectedTabIndex - 1;
            return {selectedTabIndex: newIndex<0 ? this.state.allTabs.length-1 : newIndex};
        });
    }

    jumpToTab(tabID){
        chrome.tabs.update(tabID, {active: true, highlighted:true});
    }

    appendInputText(char) {
        this.setState((prevState, props) => {
            this.updateMatcher(prevState.inputText + char);
            return {inputText: prevState.inputText + char};
        });
        //TODO: remove hardcode
    }

    updateMatcher(inputText){
        var curriedIfMatch = R.curry(ifMatch)(inputText);
        var matchedTabsIndex = R.map((pair) => pair[1], R.filter((pair) => curriedIfMatch(pair[0]), R.addIndex(R.map)((tab, index) => [tab.title, index], this.state.allTabs)));
        this.setState({matchedTabsIndex: matchedTabsIndex});
        this.setState({selectedTabIndex: matchedTabsIndex[0]});
    }

    handleKeyPress(e) {
        var inputChar = String.fromCharCode(e.charCode);
        this.appendInputText(inputChar);
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
            <div tabIndex="0" onKeyDown={this.handleKeyDown} onKeyPress={this.handleKeyPress}>
                <InputDisplay inputText={this.state.inputText}/>
                <TabsDisplay allTabs={this.state.allTabs} matchedTabsIndex={this.state.matchedTabsIndex} selectedTabIndex={this.state.selectedTabIndex}/>
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
