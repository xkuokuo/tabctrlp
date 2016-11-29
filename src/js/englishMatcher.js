var R = require('ramda');

function containsUpperCase(str) {
    return str.toLowerCase() != str;
}

function addMarkups (pattern, testStr) {
    var resultList = [];
    addMarkupRecursive(pattern, testStr, '', resultList, containsUpperCase(pattern));
    var mergedResultList = R.map((res) => res.replace(/<\/mark><mark>/g, ''), resultList);
    var numOfMarksCount = R.map(countMarkTag, mergedResultList);
    if (mergedResultList.length > 0) {
        return mergedResultList[findMinIndex(numOfMarksCount)]
    } else {
        return [];
    }
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

function addMarkupRecursive(pattern, testStr, partialRes, resultList, caseSensitive) {
    if (pattern.length === 0) {
        //base case, find a solution
        resultList.push(partialRes + testStr);
        return;
    }

    var remaining = caseSensitive ? testStr : testStr.toLowerCase();
    var remainingOriginal  = testStr;
    while(remaining.length >= pattern.length) {
        var pos = remaining.indexOf(pattern.charAt(0));
        if (pos <= -1) {
            return;        //not a potential solution
        }
        //add/mark the result to partial res and go ahead (recursive call)
        var newPartialRes = partialRes + remainingOriginal.substring(0,pos) +
            '<mark>' + remainingOriginal.charAt(pos) + '</mark>';
        addMarkupRecursive(pattern.substring(1), remainingOriginal.substring(pos + 1), newPartialRes, resultList, caseSensitive);
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
