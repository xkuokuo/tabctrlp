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
        this.state = {allTabs: [], matchedTabsIndex: [], selectedTabIndex: 0};
        getAllTabsOfCurrentWindow((returnedTabs) => {
            this.setState({allTabs: returnedTabs});
        });
        chrome.tabs.getSelected((tab) => {
            //TODO: getSelected methos is deprecated. Replace it
            this.setState({selectedTabIndex: tab.index});
        });
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    handleKeyDown(e){
        if (e.keyCode == 38) {
            this.moveUp();
        }else if (e.keyCode == 40) {
            this.moveDown();
        }else if (e.keyCode == 13) {
            this.jumpToTab(this.getSelectedTabID());
        }
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

    render() {
        var tabEntrys =  R.map((tab) =>
            <TabEntry key={tab.id} tab={tab} selected={tab.index===this.state.selectedTabIndex?true:false}/>,
            this.state.allTabs);
        return (
            <div onKeyDown={this.handleKeyDown}>
                {this.props.children}
                <ul className="tab-list list-unstyled clear-fix">
                    {tabEntrys}
                </ul>
            </div>);
    }
}


//input display div box
class InputDisplay extends React.Component {
    constructor(props) {
        super(props)
        this.state = {input: ''};
        this.handleKeyPress = this.handleKeyPress.bind(this);
    }

    handleKeyPress(e){
        var inputChar = String.fromCharCode(e.charCode);
        this.setState((prevState, props) => ({
            input: prevState.input + inputChar
        }));
    }

    appendToDisplay(char){
        this.setState((prevState, props) => ({
            input: prevState.input + inputChar
        }));
    }

    render() {
        return <div className="input-display" tabIndex="0" onKeyPress={this.handleKeyPress}>{this.state.input}</div>;
    }
}

//Display all tabs
document.addEventListener('DOMContentLoaded', function() {
    ReactDOM.render(
        <TabsDisplay><InputDisplay/></TabsDisplay>,
        document.getElementById('root')
    );
});


