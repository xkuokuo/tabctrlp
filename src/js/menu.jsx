var R = require('ramda');
var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');
var ReactCSSTransitionGroup = require('react-addons-css-transition-group');
var chineseMatcher = require('./chineseMatcher');
var englishMatcher = require('./englishMatcher');

function containsUpperCase(str) {
    return str.toLowerCase() != str;
}

function addMarkups(pattern, testStr) {
    if (chineseMatcher.containsChinese(testStr)) {
        return chineseMatcher.addMarkups(pattern, testStr);
    } else {
        return englishMatcher.addMarkups(pattern, testStr);
    }
}

function countMarkTag(str) {
    if (str)
        return (str.match(/<mark>/g)||[]).length;
    else
        return 0;
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
    constructor(props) {
        super(props);
        this.jumpToTab = this.jumpToTab.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleRemove = this.handleRemove.bind(this);
        this.handleHover = this.handleHover.bind(this);
    }

	handleRemove(event){
		this.props.handleRemove(this.props.tab.id);
	}

	handleHover(event) {
		this.props.handleHover(this.props.tab.id);
	}

    handleClick(event){
        this.jumpToTab(this.props.tab.id);
    }

    jumpToTab (tabId) {
        chrome.tabs.update(tabId, {active: true, highlighted:true});
    }

    render() {
        var className = "clearFix col-md-10 col-sm-10 col-xs-10 " +
            (this.props.selected?" tab-selected ":"");
        return (
			<div className="row">
            	<li className={ className }
					onClick={this.handleClick}
					onMouseOver={this.handleHover}>
                	<img className="img-responsive pull-left" src={this.props.tab.favIconUrl}/>
                	<p className="tab-title"
                    	dangerouslySetInnerHTML={{__html: this.props.tab.title}}>
                	</p>
                	<p className="hidden">{this.props.tab.id}</p>
            	</li>
				<div className="col-md-2 col-sm-2 col-xs-2">
					<button className="btn-remove" onClick={this.handleRemove}>X</button>
				</div>
			</div>
		);
    }
}

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
        var tabEntrys = R.map((tab) => {
                let selected = tab.index===this.props.selectedTabIndex?true:false;
                //let current = tab.index===this.props.currentTabIndex?true:false;
                return <TabEntry
                    tab={tab} key={tab.id}
                    ref={(tabEntry)=>{
                        if(selected){
                            this.selectedTabEntry = tabEntry;
                        }
                    }}
					handleRemove={this.props.handleRemove}
					handleHover={this.props.handleHover}
                    selected={selected}/>;
            },
            this.props.matchedTabs);

        return (<div className="tabs-list">
				<ul className="list-unstyled clear-fix">
                    {tabEntrys}
				</ul></div>);
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
        //some init works
        var backgroundPage = chrome.extension.getBackgroundPage();
        if (backgroundPage) {
            let allTabs = backgroundPage.getAllTabs();
            let currentTabIndex = backgroundPage.getCurrentTabIndex();
            let matchedTabs = R.map((tab) => new TabModel({title: tab.title, favIconUrl: tab.favIconUrl, id: tab.id, index: tab.index}), allTabs);
            this.allTabs = allTabs;
            this.currentTabIndex = currentTabIndex;
            this.state = {matchedTabs: matchedTabs, highlightedTabPos: currentTabIndex, inputText: ''};
        } else {
            this.state = {matchedTabs: [], highlightedTabPos: 0, inputText: ''};
        }

		//method binding
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleInputChange= this.handleInputChange.bind(this);
        this.updateMatchedTabs = this.updateMatchedTabs.bind(this);
        this.handleRemove= this.handleRemove.bind(this);
        this.handleHover = this.handleHover.bind(this);
		this.updateHighlightedPos = this.updateHighlightedPos.bind(this);

		//some state init
		this.highlightedTabPosHistory = [];
		this.inputText= '';
    }

    getSelectedTabID(){
        return this.state.matchedTabs[this.state.highlightedTabPos].id;
    }

    moveDown(){
        this.setState((prevState, props) => {
            var newIndex = prevState.highlightedTabPos + 1;
            return {
                highlightedTabPos: newIndex>=this.state.matchedTabs.length ? 0 : newIndex};
        });
    }

    moveUp(){
        this.setState((prevState, props) => {
            var newIndex = prevState.highlightedTabPos- 1;
            return {
                highlightedTabPos: newIndex<0 ? this.state.matchedTabs.length-1 : newIndex};
        });
    }

    jumpToTab(tabId){
        chrome.tabs.update(tabId, {active: true, highlighted:true});
    }

	handleHover(tabId) {
		R.addIndex(R.map)((tab, index) => {
			if (tab.id === tabId) {
				this.setState({highlightedTabPos: index});
			}
			},
			this.allTabs);
	}

    handleRemove(tabId) {
        chrome.tabs.remove(tabId);
		chrome.tabs.onRemoved.addListener((tabId)=>{
            let backgroundPage = chrome.extension.getBackgroundPage();
            backgroundPage.getAllTabsOfCurrentWindow((allTabs) => {
                this.allTabs = allTabs;
                var matchedTabs =  this.updateMatchedTabs(this.inputText);
                if (matchedTabs.length <= this.state.highlightedTabPos) {
                    this.setState({highlightedTabPos: matchedTabs.length-1})
                }
            })
        });
	}

	updateHighlightedPos() {
		if (this.state.highlightedTabPos >= this.state.matchedTabs.length) {
			this.setState({highlightedTabPos: 0});
		}
	}

    updateMatchedTabs(inputText){
		var matchedTabs;
        if (inputText) {
            var ifContainsMarkup = (str) => {
                return str.indexOf('<mark>') >= 0;
            }
            matchedTabs = R.sort((tab1, tab2) => {
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
                            this.allTabs))));
            this.setState({matchedTabs: matchedTabs});
        } else {
            matchedTabs = R.map((tab) => new TabModel({title: tab.title, favIconUrl: tab.favIconUrl, id: tab.id, index: tab.index}), this.allTabs);
            this.setState({matchedTabs: matchedTabs});
        }
		return matchedTabs;
    }

    handleInputChange(e) {
		var oldInputText = this.inputText;
		var newInputText = e.target.value;

        e.persist();
		this.inputText = e.target.value;
        var matchedTabs = this.updateMatchedTabs(e.target.value);
        this.setState({inputText: e.target.value});

		if(oldInputText.length < newInputText.length) {
			this.highlightedTabPosHistory.push(this.state.highlightedTabPos);
			this.setState({highlightedTabPos: 0});
		} else {
			var prevPos = this.highlightedTabPosHistory.pop();
            this.setState({highlightedTabPos: prevPos?prevPos:0});
		}
    }

    handleKeyDown(e) {
        if (e.keyCode == 38) {
            this.moveUp();
        }else if (e.keyCode == 40) {
            this.moveDown();
        }else if (e.keyCode == 13) {
            this.jumpToTab(this.getSelectedTabID());
		}else if (e.keyCode == 111118) {
            this.handleRemove(this.getSelectedTabID());
		}
    }

    render() {
        return (<ReactCSSTransitionGroup
			transitionAppear={true}
		    transitionAppearTimeout={3000}
		    transitionName="panel"
			transitionEnter={false}
		    transitionLeave={false}>
				<div className="panel container" key={"dummykdy"} onKeyDown={this.handleKeyDown}>
                 	<InputDisplay tabIndex="0" inputText={this.state.inputText} onChange={this.handleInputChange}/>
                 	<TabsList
                        matchedTabs={this.state.matchedTabs}
						handleRemove={this.handleRemove}
						handleHover={this.handleHover}
                        currentTabIndex = {this.currentTabIndex}
                        selectedTabIndex={(this.state.matchedTabs.length > this.state.highlightedTabPos)?this.state.matchedTabs[this.state.highlightedTabPos].index:0}/>
                </div>
			</ReactCSSTransitionGroup>);
    }
}

//Display all tabs
document.addEventListener('DOMContentLoaded', function() {
    ReactDOM.render(
		<App/>,
        document.getElementById('root')
    );
});
