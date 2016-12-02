var R = require('ramda');
var pinyin = require('pinyin');
var count = 0;

function containsUpperCase(str) {
    return str.toLowerCase() != str;
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
    var resultsArr = []
    addMarkupsChineseRecursive(pattern, testStr, '', resultsArr, containsUpperCase(pattern));
    var mergedResultList = resultsArr;
    var numOfMarksCount = R.map(countMarkTag, mergedResultList);
    console.log("recursive count for chinese matcher is " + count);
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
    /*
    console.log("Remaining: " + remaining)
    console.log("pattern: " + pattern)
    */
    //while(remaining.length >= pattern.length) {
    while(remaining.length >= 0) {
        var ifPartialResEndsWithMark = partialRes.endsWith(endingMark);
        /*
        if (resultsArr.length > 0) {
            for (let result of resultsArr) {
                if (result.length <= partialRes.length + remaining.length + (ifPartialResEndsWithMark?0:(beginingMark.length+endingMark.length))) {
                    return;
                }
            }
        }
        */
        count = count + 1;

        var pos = -1;
        for (let i = 0; i < remaining.length; i ++) {
            if (isChineseChar(remaining.charAt(i))) {
                /*
                    for each pinyin case, check if this cahr could match
                    if have match(s), call next recursive(s)
                    and nomatter match or not, skip this chineseChar
                */
                R.forEach((pinyin) => {
                    for (let j = 0; j < pattern.length && j < pinyin.length; j++) {
                        let ifCharMatch = (pattern.charAt(j) == pinyin.charAt(j));
                        /*
                        console.log("char: " + remaining.charAt(i));
                        console.log("pinyin: " + pinyin);
                        console.log("pattern[]: " + pattern);
                        console.log("partialRes: " + partialRes);
                        console.log("ifCharMatch: " + ifCharMatch);
                        console.log("ifConditionMatch: " +(ifCharMatch && (j===(pattern.length-1) || j===(pinyin.length-1))));
                        */
                        if ((ifCharMatch && (j===(pattern.length-1) || j===(pinyin.length-1)))|| ((!ifCharMatch) && j != 0)) {
                            //find a match
                            /*
                            if(j===(pattern.length-1) && j===(pinyin.length-1))
                                console.log("FUCK")
                                */
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
                            addMarkupsChineseRecursive(pattern.substring(patternPos+1), remaining.substring(pos+1), newPartialRes, resultsArr, caseSensitive)
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
            return;        //not a potential solution
        }
        //ignore the result, move remaining to a new position, move partialRes to a new position
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

/*
function addMarkupsRecursive(pattern, testStr, partialRes, resultList, caseSensitive, delimiter) {
    if (pattern.length === 0) {
        //base case, find a solution
        resultList.push(partialRes + testStr);
        return;
    }
    if (!aggressiveMatch(pattern, testStr)) {
        return;
    }
    var remaining = caseSensitive ? testStr : testStr.toLowerCase();
    var remainingOriginal  = testStr;
    var beginingMark = '<mark>';
    var endingMark = '<\/mark>';
    count  = count + 1;
    while(remaining.length >= pattern.length) {
        var ifPartialResEndsWithMark = partialRes.endsWith(endingMark);
        //if could early terminate all the recursive calls
        if (resultList.length > 0) {
            for (let result of resultList) {
                if (result.length <= partialRes.length + remaining.length + ifPartialResEndsWithMark?0:(beginingMark.length+endingMark.length)) {
                    return;
                }
            }
        }

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
*/

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
        } else {
            prevChars = prevChars + char;
        }
    }
    if (prevChars) {
        resultArr.push(prevChars)
    }
    return resultArr;
}

module.exports = {
    convertChineseCharToPinyin: convertChineseCharToPinyin,
    containsChinese: containsChinese,
    convertStrToPinyin: convertStrToPinyin,
    addMarkups: addMarkupsChinese,
}
