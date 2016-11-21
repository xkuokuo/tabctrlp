var R = require('ramda');
var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');

function getAllTabsOfCurrentWindow(callback) {
    getAllTabs(chrome.windows.WINDOW_ID_CURRENT, callback);
}

function getAllTabs(windowId, callback) {
    chrome.tabs.query({windowId: windowId}, function(Tabs) {
        callback(Tabs);
    });
}

function ifMatch(pattern, testStr) {
    var pos = 0;
    for (let char of pattern) {
        if (testStr.indexOf(char) <= pos) {
            return false;
        }
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
            this.props.allTabs);
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
        this.state = {allTabs: [], matchedTabsIndex: [], selectedTabIndex: 0, inputText: 'HH'};
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
        this.setState((prevState, props) => ({
            inputText: prevState.inputText + char
        }));
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


