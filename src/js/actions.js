const JUMP_TO_TAB = 'JUMP_TO_TAB';
const REMOVE_TAB = 'REMOVE_TAB';
const KEY_DOWN = 'KEY_DOWN';
const INPUT_CHANGED = 'INPUT_CHANGED';
const MOUSE_HOVERED = 'MOUSE_HOVERED';

function jumpToTab(id) {
    return {type: JUMP_TO_TAB, id: id};
}

function removeTab(id) {
    return {thpe: REMOVE_TAB, id: id};
}

function keyDown(keyCode) {
    return {type: KEY_DOWN, keyCode: keyCode};
}

function inputChanged(inputText) {
    return {type: INPUT_CHANGED, inputText: inputText};
}

function mouseOver(id) {
    return {type: MOUSE_HOVERED, id: id};
}

module.exports = {
    jumpToTab: jumpToTab,
    removeTab: removeTab,
    inputChanged: inputChanged,
    mouseOver : mouseOver,
    keyDown: keyDown,
    JUMP_TO_TAB: JUMP_TO_TAB,
    REMOVE_TAB: REMOVE_TAB,
    KEY_DOWN: KEY_DOWN,
    INPUT_CHANGED: INPUT_CHANGED,
    MOUSE_HOVERED: MOUSE_HOVERED
}
