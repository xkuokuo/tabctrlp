var R = require('ramda');
var pinyin = require('pinyin');
var recursiveLimit = 2000;

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

function convertChineseCharToSinglePinyin(chineseChar){
    let pinyins = convertChineseCharToPinyin(chineseChar);
    if (pinyins.length == 0) {
        return '';
    } else {
        return pinyins[0][0];
    }
}

function convertChineseCharToPinyin(chineseChar){
    return pinyin(chineseChar, {heteronym: true, style: pinyin.STYLE_NORMAL});
}

/**
 *
 */
function addMarkupsToChinese(pattern, testStr, beginingMark='<mark>', endingMark='<\/mark>') {
    var matchedPositions = new Set(matchAgainstChineseStr(pattern, testStr));
    var res = ''
    // add markups to all matched char
    for (var i = 0; i < testStr.length; i++) {
        if (matchedPositions.has(i)) {
            res = res + beginingMark + testStr.charAt(i) + endingMark;
        } else {
            res = res + testStr.charAt(i);
        }
    }
    // remove duplicated marks. This way is so silly but I don't have time to optimize
    res = res.split(endingMark + beginingMark).join('');
    return res;
}

/**
 * Returning a list of positions (list of num) representing the best
 * pinyin matching result
 */
function matchAgainstChineseStr(pattern, testStr) {
    var matchedCandidates = matchAgainstChineseStrRecursive(pattern, testStr, 0, containsUpperCase(pattern), 0);
    var numOfBreakPoints = R.map(l => numOfInconsecutivePoints(l), matchedCandidates)
    return matchedCandidates[findMinIndex(numOfBreakPoints)];
}

function numOfInconsecutivePoints(listOfNum) {
    var count = 0;
    for (var i = 1; i < listOfNum.length; i ++) {
        if (listOfNum[i] - listOfNum[i-1] != 1)
            count ++;
    }
    return count;
}

/**
 * Returning a list of list of positions (starting from startingPos)
 * representing all pinyin matching result.
 */
function matchAgainstChineseStrRecursive(pattern, testStr, startingPos, caseSensitive, count) {
    var results = [];

    if (pattern.length === 0) {
        return [[]];
    }

    if (testStr.length === 0) {
        return results;
    }

    count = count + 1;
    if (count > recursiveLimit) {
        return results; //too much recursive calls, would impact user experience.
    }

    var remaining = caseSensitive ? testStr : testStr.toLowerCase();
    while(remaining.length > 0) {
        var matchedPos = -1;
        for (let i = 0; i < remaining.length; i ++) {
            if (isChineseChar(remaining.charAt(i))) {
                // Chinese matching mode
                // ignore multiple pinyin first...
                var pinyin = convertChineseCharToSinglePinyin(remaining.charAt(i));
                var singlePinyinMachedCount = singlePinyinMatch(pinyin, pattern)
                if (singlePinyinMachedCount > 0) {
                    matchedPos = startingPos + i;
                    var subResults = matchAgainstChineseStrRecursive(pattern.substring(singlePinyinMachedCount), remaining.substring(i + 1), matchedPos + 1, caseSensitive, count + 1);
                    results = R.concat(results, R.map(l => R.prepend(matchedPos, l), subResults))
                }
            } else {
                // Switch to English matching mode
                if (remaining.charAt(i) === pattern.charAt(0)){
                    // we have a match!
                    matchedPos = startingPos + i;
                    var subResults = matchAgainstChineseStrRecursive(pattern.substring(1), remaining.substring(i + 1), matchedPos + 1, caseSensitive, count + 1);
                    results = R.concat(results, R.map(l => R.prepend(matchedPos, l), subResults))
                }
            }
        }
        if (matchedPos >= 0) {
            //skip matched resultchar, continue matching
            remaining = remaining.substring(1 + matchedPos);
        } else { // no match anymore... return results directly
            return results;
        }
    }
    return results;
}

function singlePinyinMatch(pinyin, pattern) {
    if (pattern.length === 0 || pinyin.length === 0 || pattern.charAt(0) != pinyin.charAt(0)) {
        // At least has to match the first char of pinyin.
        return 0;
    }
    var matchedCount = 1;
    var pos = 1;
    while (pos < pinyin.length && pos < pattern.length && (pinyin.charAt(pos) === pattern.charAt(pos))) {
        matchedCount ++;
        pos++;
    }
    return matchedCount;
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

module.exports = {
    matchAgainstChineseStr: matchAgainstChineseStr,
    convertChineseCharToPinyin: convertChineseCharToPinyin,
    containsChinese: containsChinese,
    addMarkups: addMarkupsToChinese,
}
