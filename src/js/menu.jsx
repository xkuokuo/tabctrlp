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

function addMarkupAdvanced (pattern, testStr) {
    var resultList = [];
    addMarkupAdvancedRecursive(pattern, testStr, '', resultList);
    var mergedResultList = R.map((res) => res.replace(/<\/mark><mark>/g, ''),resultList);
    var numOfMarksCount = R.map((res) => (res.match(/<mark>/g)||[]).length, mergedResultList);
    return mergedResultList[findMinIndex(numOfMarksCount)]
}

function findMinIndex(arr) {
    var minIndex = 0;
    for (let i = 0; i < arr.length; i++){
        if (arr[i]< arr[minIndex]) {
            minIndex = i;
        }
    }
    return minIndex;
}

function addMarkupAdvancedRecursive(pattern, testStr, partialRes, resultList) {
    if (pattern.length === 0) {
        //base case, find a solution
        resultList.push(partialRes + testStr);
        return;
    }
    if (!ifMatch(pattern, testStr)) {
        return;
    }
    var remaining = containsUpperCase(pattern) ? testStr : testStr.toLowerCase();
    var remainingOriginal  = testStr;
    while(remaining.length >= pattern.length) {
        var pos = remaining.indexOf(pattern.charAt(0));
        if (pos <= -1) {
            return;        //not a potential solution
        }
        //add/mark the result to partial res and go ahead (recursive call)
        var newPartialRes = partialRes + remainingOriginal.substring(0,pos) +
            '<mark>' + remainingOriginal.charAt(pos) + '</mark>';
        addMarkupAdvancedRecursive(pattern.substring(1), remainingOriginal.substring(pos + 1), newPartialRes, resultList);

        //ignore the result, move remaining to a new position, move partialRes to a new position
        partialRes = partialRes + remainingOriginal.substring(0, pos + 1)
        remaining = remaining.substring(pos+1);
        remainingOriginal = remainingOriginal.substring(pos+1);
    }
    return;
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
        res = res + remainingOriginal.substring(0,pos) +
            '<mark>' + remainingOriginal.charAt(pos) + '</mark>';
        remaining = remaining.substring(pos + 1);
        remainingOriginal = remainingOriginal.substring(pos + 1);
    }
    res = res + remainingOriginal;
    //replace duplicate mark tag
    res = res.replace(/<\/mark><mark>/g, '');
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
                <p className="tab-title"
                    dangerouslySetInnerHTML={{__html: this.props.decorator(this.props.tab.title)}}>
                </p>
                <p className="tabID hidden">{this.props.tab.id}</p>
            </li>);
    }
}

class TabsList extends React.Component {
    componentDidMount() {
        this.tabsListDOM = ReactDOM.findDOMNode(this);
    }

    componentDidUpdate() {
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
                return <TabEntry
                    tab={tab} key={tab.id}
                    decorator={this.props.decorator}
                    ref={(tabEntry)=>{
                        if(selected){
                            this.selectedTabEntry = tabEntry;
                        }
                    }}
                    selected={selected}/>;
            },
            pickIndexes(this.props.matchedTabsIndex, this.props.allTabs));

        return (
                <div className="tabs-list">
                    <ul
                        className="tab-list list-unstyled clear-fix">
                        {tabEntrys}
                    </ul>
                </div>
            );
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
        this.state = {allTabs: [], matchedTabsIndex: [], hightlightedTabPos: 0, inputText: '', matchedTitles: []};
        getAllTabsOfCurrentWindow((returnedTabs) => {
            this.setState({allTabs: returnedTabs});
            var curriedIfMatch = R.curry(ifMatch)('');
            var matchedTabsIndex = R.map((pair) => pair[1],
                R.filter((pair) => curriedIfMatch(pair[0]),
                    R.addIndex(R.map)((tab, index) => [tab.title, index],
                        returnedTabs)));
            this.setState({matchedTabsIndex: matchedTabsIndex});
        });
        chrome.tabs.getSelected((tab) => {
            //TODO: getSelected methos is deprecated. Replace it
            this.setState({hightlightedTabPos: tab.index});
        });
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleInputChange= this.handleInputChange.bind(this);
        this.updateMatcher = this.updateMatcher.bind(this);
    }

    getSelectedTabID(){
        return this.state.allTabs[this.state.matchedTabsIndex[this.state.hightlightedTabPos]].id;
    }

    moveDown(){
        this.setState((prevState, props) => {
            var newIndex = prevState.hightlightedTabPos + 1;
            return {
                hightlightedTabPos: newIndex>=this.state.matchedTabsIndex.length ? 0 : newIndex};
        });
    }

    moveUp(){
        this.setState((prevState, props) => {
            var newIndex = prevState.hightlightedTabPos- 1;
            return {
                hightlightedTabPos: newIndex<0 ? this.state.matchedTabsIndex.length-1 : newIndex};
        });
    }

    jumpToTab(tabID){
        chrome.tabs.update(tabID, {active: true, highlighted:true});
    }

    updateMatcher(inputText){
        var curriedIfMatch = R.curry(ifMatch)(inputText);
        var matchedTabsIndex = R.map((pair) => pair[1],
            R.filter((pair) => curriedIfMatch(pair[0]),
                R.addIndex(R.map)((tab, index) => [tab.title, index],
                    this.state.allTabs)));
        this.setState({matchedTabsIndex: matchedTabsIndex});
        this.setState({hightlightedTabPos: 0});
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
                <TabsList
                    decorator={R.curry(addMarkupAdvanced)(this.state.inputText)}
                    allTabs={this.state.allTabs}
                    matchedTabsIndex={this.state.matchedTabsIndex}
                    selectedTabIndex={this.state.matchedTabsIndex[this.state.hightlightedTabPos]}/>
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
