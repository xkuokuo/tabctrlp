var R = require('ramda');
var pinyin = require('pinyin');

function containsUpperCase(str) {
    return str.toLowerCase() != str;
}

function containsChinese(str){
    if(/.*[\u4e00-\u9fa5]+.*$/.test(str)) {
        return true;
    }
    return false;
}

function isChineseChar(char) {
    var charCode = char.charCodeAt(0);
    if (charCode <= 0x9fa5 && charCode >= 0x4e00) {
        return true;
    }
    return false;
}

function convertChineseCharToPinyin(chineseChar){
    return pinyin(chineseChar, {heteronym: true, style: pinyin.STYLE_NORMAL});
}

function convertStrToPinyin(chineseStr) {
    var resultsArr = [];
    convertStrToPinyinRecursive(chineseStr, '', resultsArr);
    return resultsArr;
}

function convertStrToPinyinRecursive(chineseStr, partialResult, resultsArr) {
    if (!chineseStr){
        resultsArr.push(partialResult);
        return;
    }
    var pinyinStr = partialResult;
    var  char = chineseStr.charAt(0);
    if (isChineseChar(char)) {
        //convert to pinyin
        let pinyins = pinyin(char, {heteronym: true, style: pinyin.STYLE_NORMAL})[0];
        for (let pinyin of pinyins ) {
            var capitalPinyin = ' ' + pinyin.charAt(0).toUpperCase() + pinyin.substring(1) + ' ';
            convertStrToPinyinRecursive(chineseStr.substring(1), partialResult+capitalPinyin, resultsArr)
        }
        //for ever case
    } else {
        pinyinStr = pinyinStr + char;
        convertStrToPinyinRecursive(chineseStr.substring(1), partialResult+char, resultsArr);
    }
}

function ifMatch(pattern, testStr) {

    if (containsChinese(testStr)) {
        testStr = convertStrToPinyin(testStr)[0];
    }

    if (containsUpperCase(pattern)) {
        return ifMatchCaseSensitive(pattern, testStr);
    } else {
        return ifMatchCaseSensitive(pattern, testStr.toLowerCase());
    }
}

function ifMatchCaseSensitive(pattern, testStr) {
    var remaining = testStr;
    for (let char of pattern) {
        var pos = remaining.indexOf(char);
        if (pos <= -1) {
            return false;
        }
        remaining = remaining.substring(pos+1);
    }
    return true;
}

function addMarkups(pattern, testStr) {
    var originalStr = testStr;
    testStr = convertStrToPinyin(testStr)[0];
    var resultsArr = []
    addMarkupsRecursive(pattern, testStr.trim(), '', resultsArr);
    var splitedOriginalStr = splitByChineseChar(originalStr.trim());
    var splitedResultsArr = R.map((result)=> result.trim().split(/\s+/), resultsArr);

    var markedResultArr = []

    for (let splitedResult of splitedResultsArr) {
        console.log(originalStr);
        console.log(splitedResult);
        console.log(splitedOriginalStr);
        if (splitedOriginalStr.length == splitedResult.length) {
            for (let j = 0; j < splitedOriginalStr.length; j ++) {
                if (containsChinese(splitedOriginalStr[j]) && splitedResult[j].match(/<mark>/)) {
                    splitedResult[j]  = '<mark>' + splitedOriginalStr[j] + '</mark>';
                } else {
                    splitedResult[j]  = splitedOriginalStr[j];
                }
            }
            markedResultArr.push(splitedResult.join(' '));
        }
    }
    var mergedResultList = R.map((res) => res.replace(/<\/mark><mark>/g, ''), markedResultArr);
    var numOfMarksCount = R.map(countMarkTag, mergedResultList);
    return mergedResultList[findMinIndex(numOfMarksCount)]
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
    if (!ifMatch(pattern, testStr)) {
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
        addMarkupsRecursive(pattern.substring(1), remainingOriginal.substring(pos + 1), newPartialRes, resultList, caseSensitive);
        //ignore the result, move remaining to a new position, move partialRes to a new position
        partialRes = partialRes + remainingOriginal.substring(0, pos + 1)
        remaining = remaining.substring(pos+1);
        remainingOriginal = remainingOriginal.substring(pos+1);
    }
    return;
}

function splitByChineseChar(str){
    var resultArr = [];
    var prevChars = '';
    for (let char of str) {
        if (isChineseChar(char)) {
            if (prevChars) {
                resultArr.push(prevChars)
                prevChars='';
            }
            resultArr.push(char)
        } else if (char === ' ') {
            resultArr.push(prevChars)
            prevChars = '';
        } else {
            prevChars = prevChars + char;
        }
    }
    return resultArr;
}

module.exports = {
    convertChineseCharToPinyin: convertChineseCharToPinyin,
    containsChinese: containsChinese,
    convertStrToPinyin: convertStrToPinyin,
    addMarkups: addMarkups
}
