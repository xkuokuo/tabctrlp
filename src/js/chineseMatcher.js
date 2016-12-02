var R = require('ramda');
var pinyin = require('pinyin');
var count = 0;
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

function convertChineseCharToPinyin(chineseChar){
    return pinyin(chineseChar, {heteronym: true, style: pinyin.STYLE_NORMAL});
}

function convertStrToPinyin(chineseStr, delimiter) {
    var resultsArr = [];
    if (delimiter === undefined){
        delimiter = '';
    }
    convertStrToPinyinRecursive(chineseStr, '', resultsArr, delimiter);
    return resultsArr;
}

function convertStrToPinyinRecursive(chineseStr, partialResult, resultsArr, delimiter) {
    if (delimiter === undefined){
        delimiter = '';
    }
    if (!chineseStr){
        resultsArr.push(partialResult);
        return;
    }
    var pinyinStr = partialResult;
    var  char = chineseStr.charAt(0);
    if (isChineseChar(char)) {
        //convert to pinyin
        let pinyins = pinyin(char, {heteronym: true, style: pinyin.STYLE_NORMAL});
        for (let pinyin of pinyins[0] ) {
            var capitalPinyin = delimiter + pinyin.charAt(0).toUpperCase() + pinyin.substring(1) + delimiter;
            convertStrToPinyinRecursive(chineseStr.substring(1), partialResult+capitalPinyin, resultsArr, delimiter)
        }
    } else {
        pinyinStr = pinyinStr + char;
        convertStrToPinyinRecursive(chineseStr.substring(1), partialResult+char, resultsArr, delimiter);
    }
}

function addMarkupsChinese(pattern, testStr) {
    count = 0;
    var resultsArr = []
    addMarkupsChineseRecursive(pattern, testStr, '', resultsArr, containsUpperCase(pattern));
    var mergedResultList = resultsArr;
    var numOfMarksCount = R.map(countMarkTag, mergedResultList);
    if (mergedResultList.length > 0) {
        return mergedResultList[findMinIndex(numOfMarksCount)]
    } else {
        return [];
    }
}

function addMarkupsChineseRecursive(pattern, testStr, partialRes, resultsArr, caseSensitive) {
    if (pattern.length === 0) {
        resultsArr.push(partialRes + testStr);
        return;
    }
    var beginingMark = '<mark>';
    var endingMark = '<\/mark>';
    var remaining = caseSensitive ? testStr : testStr.toLowerCase();
    var remainingOriginal  = testStr;

    while(remaining.length > 0) {
        var ifPartialResEndsWithMark = partialRes.endsWith(endingMark);
        //terminate early if there is already better solutions
        if (resultsArr.length > 0) {
            for (let result of resultsArr) {
                if (result.length <= partialRes.length + remaining.length + (ifPartialResEndsWithMark?0:(beginingMark.length+endingMark.length))) {
                    return;
                }
            }
        }

        count = count + 1;

        if (count > recursiveLimit) {
            return; //too much recursive calls, would impact user experience.
        }
        var pos = -1;
        for (let i = 0; i < remaining.length; i ++) {
            if (isChineseChar(remaining.charAt(i))) {
                //for each pinyin case, check if this cahr could match
                //if have match(s), call next recursive(s)
                //and no matter match or not, skip this chineseChar
                R.forEach((pinyin) => {
                    for (let j = 0; j < pattern.length && j < pinyin.length; j++) {
                        let ifCharMatch = (pattern.charAt(j) == pinyin.charAt(j));
                        if ((ifCharMatch && (j===(pattern.length-1) || j===(pinyin.length-1)))|| ((!ifCharMatch) && j != 0)) {
                            //find a match
                            pos = i;
                            let patternPos =ifCharMatch?j:(j-1);
                            let newPartialRes;
                            if (ifPartialResEndsWithMark && pos === 0){
                                newPartialRes = partialRes.substring(0, partialRes.length-endingMark.length) +
                                     remainingOriginal.charAt(0) + endingMark;
                            } else {
                                newPartialRes = partialRes + remainingOriginal.substring(0,pos) +
                                    beginingMark + remainingOriginal.charAt(pos) + endingMark;
                            }
                            addMarkupsChineseRecursive(pattern.substring(patternPos+1), remainingOriginal.substring(pos+1), newPartialRes, resultsArr, caseSensitive)
                            break;
                        } else if (pattern.charAt(j) != pinyin.charAt(j) && j == 0) {
                            //not a match,
                            break;
                        }
                    }
                },
                convertChineseCharToPinyin(remaining.charAt(i))[0]);
                //ignore this chinese char, continue matching
                if(pos >= 0 ){
                    break;
                }
            } else if (remaining.charAt(i) === pattern.charAt(0)) {
                //plain english char matching mode
                pos = i;
                var newPartialRes;
                if (ifPartialResEndsWithMark && pos === 0){
                    newPartialRes = partialRes.substring(0, partialRes.length-endingMark.length) +
                         remainingOriginal.charAt(0) + endingMark;
                } else {
                    newPartialRes = partialRes + remainingOriginal.substring(0,pos) +
                        beginingMark + remainingOriginal.charAt(pos) + endingMark;
                }
                addMarkupsChineseRecursive(pattern.substring(1), remainingOriginal.substring(pos + 1), newPartialRes, resultsArr, caseSensitive);
                if(pos >= 0 ){
                    break;
                }
            }
        }

        if (pos === -1 ) {
            return;        //no match char found, not even a potential solution
        }
        if (resultsArr.length === 0 && !isChineseChar(remaining.charAt(pos))) {
            //that means previous sets of recursive calls didn't find any match
            //Need to check if previous matched char is a chinese char
            //Since for chinese pinyin we can't match aggresively like english,
            //Because pinyin has rules
            return;
        }
        //ignore the matching result, move remaining to a new position, move partialRes to a new position
        partialRes = partialRes + remainingOriginal.substring(0, pos + 1)
        remaining = remaining.substring(pos+1);
        remainingOriginal = remainingOriginal.substring(pos+1);

    }
    return;
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

module.exports = {
    convertChineseCharToPinyin: convertChineseCharToPinyin,
    containsChinese: containsChinese,
    convertStrToPinyin: convertStrToPinyin,
    addMarkups: addMarkupsChinese,
}
