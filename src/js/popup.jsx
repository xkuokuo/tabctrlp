var R = require('ramda');
var $ = require('jquery');
var React = require('react');
var Redux = require('redux');
var connect = require('react-redux').connect
var Provider = require('react-redux').Provider
var ReactDOM = require('react-dom');
var ReactCSSTransitionGroup = require('react-addons-css-transition-group');
var actions = require('./actions');
var appReducer = require('./reducers');
var chineseMatcher = require('./chineseMatcher');
var englishMatcher = require('./englishMatcher');


/*
let unsubscribe = store.subscribe(() =>
    console.log(store.getState())
);
*/

/*
store.dispatch(actions.mouseHovered(1));
store.dispatch(actions.inputChanged('1'));
store.dispatch(actions.jumpToTab(1));
store.dispatch(actions.mouseHovered(1));
store.dispatch(actions.keyDown(1));
*/

const mapStateToProps = (state) => {
    console.log(state)
    return {
        states: {
            inputText: state.inputText,
            allTabs: state.allTabs,
            matchedTabs: state.matchedTabs,
            currentTabIndex: state.currentTabIndex,
            selectedTabPos: state.selectedTabPos,
            selectedTabId: state.selectedTabId
        }
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        actions: {
            onTabRemove: (id) => {
                chrome.tabs.remove(id);
                dispatch(actions.removeTab(id));
            },
            onMouseOver: (id) => {
                dispatch(actions.mouseOver(id));
            },
            onTabClick: (id) => {
                chrome.tabs.update(id, {active: true, highlighted:true});
            },
            onInputChanged: (inputText) => {
                dispatch(actions.inputChanged(inputText));
            },
            onKeyDown: (keyCode) => {
                if (keyCode === 13) {
                    chrome.tabs.update(id, {active: true, highlighted:true});
                } else {
                    dispatch(actions.keyDown(keyCode));
                }
            }
        }
    }
}

class TabModel {
    constructor(props) {
        this.title = props.title;
        this.id = props.id;
        this.favIconUrl = props.favIconUrl;
        this.index = props.index;
    }
}

class TabEntry extends React.Component {
    render() {
        var className = "clearFix col-md-10 col-sm-10 col-xs-10 ";
        className = className + (this.props.selected?" tab-selected":"");
        return (
            <div className="row">
                <li className={ '' }
                    onClick={()=>this.props.onTabClick(this.props.tab.id)}
                    onMouseOver={()=>this.props.onMouseOver(this.props.tab.id)}>
                    <img className="img-responsive pull-left" src={this.props.tab.favIconUrl}/>
                    <p className="tab-title"
                        dangerouslySetInnerHTML={{__html: this.props.tab.title}}>
                    </p>
                    <p className="hidden">{this.props.tab.id}</p>
                </li>
            <div className="col-md-2 col-sm-2 col-xs-2">
                <button className="btn-remove" onClick={()=>this.props.onTabRemove(this.props.tab.id)}>X</button>
                </div>
            </div>);
    }
}

/*
TabEntry.propTypes = {
    onClick: React.PropTypes.func.isRequired,
    onRemove: React.PropTypes.func.isRequired,
    tab: React.PropTypes.object.isRequired
}
*/


class TabsList extends React.Component {
    constructor (props){
        super(props);
        this.adjustScrollBar = this.adjustScrollBar.bind(this);
    }
    componentDidMount() {
        this.tabsListDOM = ReactDOM.findDOMNode(this);
        this.adjustScrollBar();
    }

    componentDidUpdate() {
        this.adjustScrollBar();
    }

    adjustScrollBar(){
        if (this.selectedTabEntry) {
            var tabsListHeight = this.tabsListDOM.offsetHeight;
            var scrollOffset = this.tabsListDOM.scrollTop;
            var selectedTabEntryDOM = ReactDOM.findDOMNode(this.selectedTabEntry);
            var tabHeight = selectedTabEntryDOM.offsetHeight;

            if (selectedTabEntryDOM.offsetTop + tabHeight > tabsListHeight + scrollOffset) {
                scrollOffset = selectedTabEntryDOM.offsetTop - tabsListHeight;
            } else if (selectedTabEntryDOM.offsetTop < scrollOffset) {
                scrollOffset = selectedTabEntryDOM.offsetTop - tabHeight;
            }

            ReactDOM.findDOMNode(this).scrollTop = scrollOffset;
        }
    }

    render() {
        console.log("Ha tabsList ?")
        console.log("Ha allTabs?" + this.props.allTabs)
        console.log("Ha selectedTabId?" + this.props.selectedTabId)
        console.log("Ha currentTabIndex?" + this.props.currentTabIndex)
        console.log("Ha matchedTabs?" + this.props.matchedTabs)
        var tabEntrys = R.map((tab) => {
                console.log("Ha tabsList tabentry?")
                let selected = tab.id===this.props.selectedTabId?true:false;
                return <TabEntry
                    tab={tab}
                    key={tab.id}
                    ref={(tabEntry)=>{
                        if(selected){
                            this.selectedTabEntry = tabEntry;
                        }
                    }}
                    onTabRemove={this.props.onTabRemove}
                    onTabClick={this.props.onTabClick}
                    onMouseOver={this.props.onMouseOver}
                    selected={selected}/>;
            },
            this.props.matchedTabs);

        return (<div className="tabs-list">
                <ul className="list-unstyled clear-fix">
                    {tabEntrys}
                </ul></div>);
    }
}

class InputDisplay extends React.Component {
    constructor(props) {
        super(props);
        this.restoreFocus = this.restoreFocus.bind(this);
    }

    restoreFocus() {
        this.realInput.focus();
    }

    render() {
        console.log("Hey inputText: " + this.props.inputText)
        return (
            <div className="input-div-container">
                <input ref={(input)=>{this.realInput = input;}} type="password" tabIndex="0" className="input-real" value={this.props.inputText} onChange={this.props.onInputChanged}/>
                <input type="text" className="input-display" value={this.props.inputText} onClick={this.restoreFocus}/>
            </div>);
    }
}

/*
class App extends React.Component {
    render() {
        return (<ReactCSSTransitionGroup
            transitionAppear={true}
            transitionAppearTimeout={3000}
            transitionName="panel"
            transitionEnter={false}
            transitionLeave={false}>
            <div className="panel container" key={"dummykdy"}
                onKeyDown={(event) => this.props.onKeyDown(event.keyCode)}>
                <InputDisplay
                    inputText={this.props.inputText}
                    onChange={this.props.onInputChange}/>
                <TabsList
                    onTabRemove={this.props.onTabRemove}
                    onTabClick={this.props.onTabClick}
                    onMouseOver={this.props.onMouseOver}
                    currentTabIndex = {this.props.currentTabIndex}
                    matchedTabs={this.props.matchedTabs}
                    selectedTabId={this.props.selectedTabId}/>
            </div>
        </ReactCSSTransitionGroup>);
    }
}
*/

//let App = (inputText, currentTabIndex, selectedTabId, matchedTabs, allTabs, onMouseOver, onTabClick, onTabRemove, onInputChanged, onKeyDown) => {
let App = ({states, actions}) => {
        return (<ReactCSSTransitionGroup
            transitionAppear={true}
            transitionAppearTimeout={3000}
            transitionName="panel"
            transitionEnter={false}
            transitionLeave={false}>
            <div className="panel container" key={"dummykdy"}
                onKeyDown={(event) => {actions.onKeyDown(event.keyCode);}}>
                <InputDisplay
                    inputText={states.inputText}
                    onInputChanged={actions.onInputChanged}/>
                <TabsList
                    onTabRemove={actions.onTabRemove}
                    onTabClick={actions.onTabClick}
                    onMouseOver={actions.onMouseOver}
                    allTabs={states.allTabs}
                    matchedTabs={states.matchedTabs}
                    currentTabIndex={states.currentTabIndex}
                    selectedTabId={states.selectedTabId}/>
            </div>
        </ReactCSSTransitionGroup>);
}

var backgroundPage = chrome.extension.getBackgroundPage();

var initState = {
    inputText: '',
    allTabs: backgroundPage.getAllTabs(),
    matchedTabs: backgroundPage.getAllTabs(),
    currentTabIndex: backgroundPage.getCurrentTabIndex(),
    selectedTabPos: backgroundPage.getCurrentTabIndex(),
    selectedTabId: backgroundPage.getAllTabs()[backgroundPage.getCurrentTabIndex()].id
}

var store = Redux.createStore(appReducer, initState);

/*
let unsubscribe = store.subscribe(() =>
  console.log(store.getState())
)

store.dispatch(actions.jumpToTab(1));
*/

const RootApp = connect(
      mapStateToProps,
      mapDispatchToProps

)(App);

document.addEventListener('DOMContentLoaded', function() {
    ReactDOM.render(
        <Provider store={store}>
            <RootApp/>
        </Provider>,
        document.getElementById('root')
    );
});
