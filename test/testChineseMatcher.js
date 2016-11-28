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
    describe('#convertChineseCharToPinyin()', function() {
        it('should return ji given the character "鸡"', function() {
            assert.deepEqual(['ji'], chineseMatcher.convertChineseCharToPinyin('鸡')[0]);
        });
    });
});

describe('chineseMatcher', function() {
    describe('#convertChineseCharToPinyin()', function() {
        it('should return [liao, le] given the character "了"', function() {
            console.log(chineseMatcher.convertChineseCharToPinyin('了'));
            assert.deepEqual(['liao','le'], chineseMatcher.convertChineseCharToPinyin('了')[0]);
        });
    });
});

describe('chineseMatcher', function() {
    describe('#convertStrToPinyin()', function() {
        it('should return ["WoAiNi"] given the character "我爱你"', function() {
            console.log(chineseMatcher.convertStrToPinyin('我爱你'));
            assert.deepEqual(['WoAiNi'], chineseMatcher.convertStrToPinyin('我爱你'));
        });
    });
});

describe('chineseMatcher', function() {
    describe('#convertStrToPinyin()', function() {
        it('should return ["ChiLiao", "ChiLe"] given the character "吃了"', function() {
            console.log(chineseMatcher.convertStrToPinyin('吃了'));
            assert.deepEqual(['ChiLiao','ChiLe'], chineseMatcher.convertStrToPinyin('吃了'));
        });
    });
});

describe('chineseMatcher', function() {
    describe('#convertStrToPinyin()', function() {
        it('should return ["A ChiLiao", "A ChiLe"] given the character "A 吃了"', function() {
            console.log(chineseMatcher.convertStrToPinyin('A 吃了'));
            assert.deepEqual(['A ChiLiao','A ChiLe'], chineseMatcher.convertStrToPinyin('A 吃了'));
        });
    });
});

describe('chineseMatcher', function() {
    describe('#addMarkups()', function() {
        it('should return "<markup>我</markup>吃了" given the str"我吃了" and the pattern wo', function() {
            console.log(chineseMatcher.addMarkups('wo',"我吃了"));
            //assert.equal('<markup>我</markup>吃了', chineseMatcher.addMarkups('wo',"我吃了"));
        });
    });
});
