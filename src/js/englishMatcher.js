var R = require('ramda');
var count = 0;
function containsUpperCase(str) {
    return str.toLowerCase() != str;
}

function addMarkups (pattern, testStr) {
    count = 0;
    var resultList = [];
    addMarkupsRecursive(pattern, testStr, '', resultList, containsUpperCase(pattern));
    var mergedResultList = resultList;
    var numOfMarksCount = R.map(countMarkTag, mergedResultList);
    //console.log("English count is " + count);
    if (mergedResultList.length > 0) {
        return mergedResultList[findMinIndex(numOfMarksCount)]
    } else {
        return [];
    }
}

function aggressiveMatch(pattern, testStr) {
    var remaining = containsUpperCase(pattern)?testStr:testStr.toLowerCase();
    var pos;
    for (let char of pattern) {
        pos = remaining.indexOf(char);
        if (pos < 0) {
            return false;
        }
        remaining = remaining.substring(pos+1);
    }
    return true;
}

function countMarkTag(str) {
    if (str)
        return (str.match(/<mark>/g)||[]).length;
    else
        return 0;
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

function addMarkupsRecursive(pattern, testStr, partialRes, resultList, caseSensitive) {
    if (pattern.length === 0) {
        //base case, find a solution
        resultList.push(partialRes + testStr);
        return;
    }
    if (!aggressiveMatch(pattern, testStr)) {
        return;
    }
    var beginingMark = '<mark>';
    var endingMark = '<\/mark>';
    var remaining = caseSensitive ? testStr : testStr.toLowerCase();
    var remainingOriginal  = testStr;


    while(remaining.length >= pattern.length) {
        var ifPartialResEndsWithMark = partialRes.endsWith(endingMark);
        if (resultList.length > 0) {
            for (let result of resultList) {
                if (result.length <= partialRes.length + remaining.length + (ifPartialResEndsWithMark?0:(beginingMark.length+endingMark.length))) {
                    return;
                }
            }
        }
        count = count + 1;
        //if could early terminate all the recursive calls
        var pos = remaining.indexOf(pattern.charAt(0));
        if (pos <= -1) {
            return;        //not a potential solution
        }
        //add/mark the result to partial res and go ahead (recursive call)
        var newPartialRes;
        if (ifPartialResEndsWithMark && pos === 0){
            newPartialRes = partialRes.substring(0, partialRes.length-endingMark.length) +
                 remainingOriginal.charAt(0) + endingMark;
        } else {
            newPartialRes = partialRes + remainingOriginal.substring(0,pos) +
                beginingMark + remainingOriginal.charAt(pos) + endingMark;
        }
        addMarkupsRecursive(pattern.substring(1), remainingOriginal.substring(pos + 1), newPartialRes, resultList, caseSensitive);

        //ignore the result, move remaining to a new position, move partialRes to a new position
        partialRes = partialRes + remainingOriginal.substring(0, pos + 1)
        remaining = remaining.substring(pos+1);
        remainingOriginal = remainingOriginal.substring(pos+1);
    }
    return;
}

module.exports = {
    addMarkups: addMarkups,
}
