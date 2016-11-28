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

//still consider case sensitiveity
function ifMatch(pattern, testStr) {
    if (containsUpperCase(pattern)) {
        return ifMatchCaseSensitive(pattern, testStr);
    } else {
        return ifMatchCaseSensitive(pattern, testStr.toLowerCase());
    }
}

function ifMatchCaseSensitive(pattern, testStr){
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
            var capitalPinyin = pinyin.charAt(0).toUpperCase() + pinyin.substring(1);
            convertStrToPinyinRecursive(chineseStr.substring(1), partialResult+capitalPinyin, resultsArr)
        }
        //for ever case
    } else {
        pinyinStr = pinyinStr + char;
        convertStrToPinyinRecursive(chineseStr.substring(1), partialResult+char, resultsArr);
    }
}

module.exports = {
    convertChineseCharToPinyin: convertChineseCharToPinyin,
    containsChinese: containsChinese,
    convertStrToPinyin: convertStrToPinyin
}
