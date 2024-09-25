const needsInsert = ["a", "A", "I", "o", "O"]
const directionalKeys = "hjkl";
let currentMode = "insert"
let currentCommand = emptyCommand();

function switchToNormalMode() { switchMode("normal", "7px"); }
function switchToVisualMode() { switchMode("visual", "7px"); }
function switchToInsertMode() { switchMode("insert", "2px"); }

switchToNormalMode();

docs.keydown = function(e) {
    console.log(currentCommand)
    console.log(currentMode)
    switch (currentMode) {
        case 'normal':
            console.log(`NORMAL: ${e.key} - pressed`);
            eventToCommand(e);

            const move = moveCommands('n')
            if (move) {
                move()
                if (needsInsert.includes(currentCommand[0])) switchToInsertMode()
                currentCommand = emptyCommand()
                return true
            }

            const [cmd, handled] = normalCommands()
            if (cmd) {
                cmd()
                currentCommand = emptyCommand();
            }
            return handled;
        case 'visual':
            console.log(`VISUAL: ${e.key} - pressed`);
            eventToCommand(e);

            const moveVis = moveCommands('v')
            if (moveVis) moveVis()

            const [visCmd, visHandled] = visualCommands()
            if (visCmd) {
                visCmd()
                currentCommand = emptyCommand();
            }
            return visHandled;
        case 'insert':
            if (e.key === "Escape") {
                switchToNormalMode();
            }
            return true;
        default:
            mode = 'normal';
            currentCommand = emptyCommand();
    }
};

function moveCommands(mode) {
    const isVisual = mode === 'v';
    const nrep = currentCommand[1];
    switch (currentCommand[0]) {
        case "h":
            return () => repeat(() => docs.pressKey(37, false, isVisual), nrep);
        case "j":
            return () => repeat(() => docs.pressKey(40, false, isVisual), nrep);
        case "k":
            return () => repeat(() => docs.pressKey(38, false, isVisual), nrep);
        case "l":
            return () => repeat(() => docs.pressKey(39, false, isVisual), nrep);
        case "Backspace":
            return () => repeat(() => docs.pressKey(37, false, isVisual), nrep);
        case "x":
            return () => repeat(() => docs.pressKey(46, false, isVisual), nrep);
        case "b":
            return () => repeat(() => docs.pressKey(37, true, isVisual), nrep);
        case "e":
            return () => repeat(() => docs.pressKey(39, true, isVisual), nrep);
        case "w":
            return () => moveWordForward(isVisual, nrep);
        case "a":
            return () => docs.pressKey(39, false, isVisual);
        case "A":
            return () => docs.pressKey(40, true, isVisual);
        case "I":
            return () => docs.pressKey(38, true, isVisual);
        case "$":
            return () => docs.pressKey(40, true, isVisual);
        case "0":
            return () => docs.pressKey(38, true, isVisual);
        case "o":
            return () => insertNewLineBelow(isVisual);
        case "O":
            return () => insertNewLineAbove(isVisual);
        default:
            return null;
    }
}

function normalCommands() {
    const nrep = currentCommand[1];
    switch (currentCommand[0]) {
        case "":
            return [null, true];
        case "y":
            switch (currentCommand[2]) {
                case "":
                    return [null, true];
                case "w":
                    return [() => yankWord(nrep), true];
                case "y":
                    return [() => yankLine(nrep), true];
                default:
                    console.log("no case")
                    return [() => { return }, false];
            }
        case "d":
            switch (currentCommand[2]) {
                case "":
                    return [null, true]
                case "w":
                    return [() => deleteWord(nrep), true]
                case "d":
                    return [() => deleteLine(nrep), true]
                default:
                    console.log("no case")
                    return [() => { return }, false]
            }
        case "c":
            switch (currentCommand[2]) {
                case "":
                    return [null, true]
                case "w":
                    return [() => changeWord(nrep), true]
                case "c":
                    return [() => changeLine(nrep), true];
                default:
                    return [() => { return }, false]
            }
        case "g":
            switch (currentCommand[2]) {
                case "":
                    return [null, true]
                case "g":
                    return [() => docs.pressKey(36, true, false), true]
                default:
                    return [() => { return }, false]
            }
        case "G":
            return [() => docs.pressKey(35, true, false), true]
        case "i":
            return [switchToInsertMode, true]
        case "v":
            return [switchToVisualMode, true]
        case "u":
            return [() => docs.pressKey(90, true, false), true]
        case "p":
            return [handlePutCommand, true]
        default:
            console.log("no case")
            return [() => { return }, false];
    }
}

function visualCommands() {
    console.log(currentCommand[0])
    switch (currentCommand[0]) {
        case "":
            return [null, true];
        case "g":
            switch (currentCommand[2]) {
                case "":
                    return [null, true]
                case "g":
                    return [() => docs.pressKey(36, true, true), true]
                default:
                    console.log("no case")
                    return [() => { return }, false]
            }
        case "G":
            return [() => docs.pressKey(35, true, true), true]
        case "y":
            return [handleVisualYank, true]
        case "d":
            return [handleVisualDelete, true]
        case "c":
            return [handleVisualChange, true]
        case "Escape":
            return [switchToNormalMode, true]
        default:
            console.log("no case")
            return [() => { return }, false]
    }
}

// Mode switching functions
function switchMode(mode, cursorWidth) {
    currentSequence = "";
    currentMode = mode;
    num = "";
    docs.setCursorWidth(cursorWidth);
}

function repeat(func, nrep) {
    for (let i = 0; i < nrep; i++) {
        console.log(func)
        func()
    }
}

function emptyCommand() {
    return ["", 1, ""];
}

function handlePutCommand() {
    docs.clip.readText()
        .then(cltxt => docs.pasteText(cltxt))
        .catch(() => console.log("paste failed"));
}

function handleVisualYank() {
    switchToNormalMode();
    docs.cdoc.execCommand("copy");
    switchToNormalMode();
    highlightBriefly();
}

function handleVisualDelete() {
    switchToNormalMode();
    switchToNormalMode();
    highlightBriefly();
    setTimeout(() => docs.cdoc.execCommand("cut"), 50);
}

function handleVisualChange() {
    highlightBriefly();
    setTimeout(() => {
        docs.pressKey(46); // Delete key
        switchToInsertMode();
    }, 50);
}

function deleteLine(nrep) {
    docs.pressKey(40, true, false);
    docs.pressKey(38, true, false);
    repeat(() => docs.pressKey(40, true, true), nrep)
    docs.cdoc.execCommand("copy");
    highlightBriefly();
    setTimeout(() => docs.pressKey(46), 50);
}

function yankLine(nrep) {
    docs.pressKey(40, true, false);
    docs.pressKey(38, true, false);
    repeat(() => docs.pressKey(40, true, true), nrep)
    docs.cdoc.execCommand("copy");
    highlightBriefly();
    setTimeout(() => repeat(() => docs.pressKey(38, true, true), nrep), 50);
}

function changeLine(nrep) {
    docs.pressKey(40, true, false);
    docs.pressKey(38, true, false);
    repeat(() => docs.pressKey(40, true, true), nrep)
    highlightBriefly();
    setTimeout(() => {
        switchToInsertMode();
        switchToInsertMode();
        docs.pressKey(46);
    }, 50);
}

function yankWord(nrep) {
    repeat(() => docs.pressKey(39, true, true), nrep)
    docs.cdoc.execCommand("copy");
    highlightBriefly();
    setTimeout(() => repeat(() => docs.pressKey(37, true, true), nrep), 50);
}

function deleteWord(nrep) {
    repeat(() => docs.pressKey(39, true, true), nrep);
    docs.cdoc.execCommand("copy");
    highlightBriefly();
    setTimeout(() => docs.pressKey(46), 50);
}

function changeWord(nrep) {
    repeat(() => docs.pressKey(39, true, true), nrep);
    highlightBriefly();
    setTimeout(() => {
        docs.pressKey(46);
        switchToInsertMode();
        switchToInsertMode();
    }, 50);
}

function highlightBriefly() {
    docs.setColor("red");
    setTimeout(() => docs.setColor("black"), 50);
}

function highlightBriefly() {
    docs.setColor("red");
    setTimeout(() => docs.setColor("black"), 50);
}

function moveWordForward(isVisual, nrep) {
    docs.pressKey(39, true, isVisual);
    repeat(() => docs.pressKey(39, true, isVisual), nrep);
    docs.pressKey(37, true, isVisual);
}

function insertNewLineBelow(isVisual) {
    docs.pressKey(40, true, isVisual);
    docs.pressKey(13, false, isVisual);
}

function insertNewLineAbove(isVisual) {
    docs.pressKey(38, true, isVisual);
    docs.pressKey(37, false, isVisual);
    docs.pressKey(13, false, isVisual);
}

function eventToCommand(e) {
    if (e.key.match(/F\d+/)) return true;

    e.preventDefault();
    e.stopPropagation();

    const parsed = parseInt(e.key);
    if (parsed) {
        currentCommand[1] = parsed;
    } else if (currentCommand[0]) {
        currentCommand[2] = e.key;
    } else {
        currentCommand[0] = e.key;
    }
}
