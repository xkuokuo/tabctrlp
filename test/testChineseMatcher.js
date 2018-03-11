var assert = require('assert');
var chineseMatcher = require('../src/js/chineseMatcher');

describe('Array', function() {
    describe('#indexOf()', function() {
        it('should return -1 when the value is not present', function() {
            assert.equal(-1, [1,2,3].indexOf(4));
        });
    });
});

describe('chineseMatcher', function() {
    describe('#matchAgainstChineseStr()', function() {
        it('should return matched chinese char positions', function() {
            var testStr = "我吃了我碗里的肉";
            assert.deepEqual([ 3, 4 ], chineseMatcher.matchAgainstChineseStr('ww', testStr));
            assert.deepEqual([ 4, 5, 6, 7 ],  chineseMatcher.matchAgainstChineseStr('wldr', testStr));
            assert.deepEqual([ 0, 7 ], chineseMatcher.matchAgainstChineseStr('wor', testStr));
        });
    });

    describe('#addMarkups()', function() {
        it('should return "<mark>我</mark>吃了" given the str"我吃了" and the pattern wo', function() {
            console.log(chineseMatcher.addMarkups('wo',"我吃了"));
            assert.equal('<mark>我</mark>吃了', chineseMatcher.addMarkups('wo',"我吃了"));
        });
    });
});

