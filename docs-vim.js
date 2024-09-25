const directionalKeys = "hjkl";

const vim = {
    mode: "insert",
    num: "",
    currentSequence: "",
    keyMaps: {
        "Backspace": [["ArrowLeft"]],
        "x": [["Delete"]],
        "b": [["ArrowLeft", true]],
        "e": [["ArrowRight", true]],
        "w": [["ArrowRight", true], ["ArrowRight", true], ["ArrowLeft", true]],
        "a": [["ArrowRight"]],
        "A": [["ArrowDown", true]],
        "I": [["ArrowUp", true]],
        "$": [["ArrowDown", true]],
        "0": [["ArrowUp", true]],
        "o": [["ArrowDown", true], ["Enter"]],
        "O": [["ArrowUp", true], ["ArrowLeft"], ["Enter"]]
    },
    needsInsert: ["a", "A", "I", "o", "O"]
};

// Add directional keys to keyMaps
vim.keyMaps[directionalKeys[0]] = [["ArrowLeft"]];
vim.keyMaps[directionalKeys[1]] = [["ArrowDown"]];
vim.keyMaps[directionalKeys[2]] = [["ArrowUp"]];
vim.keyMaps[directionalKeys[3]] = [["ArrowRight"]];

// Mode switching functions
function switchMode(mode, cursorWidth) {
    vim.currentSequence = "";
    vim.mode = mode;
    vim.num = "";
    docs.setCursorWidth(cursorWidth);
}

vim.switchToNormalMode = () => switchMode("normal", "7px");
vim.switchToVisualMode = () => switchMode("visual", "7px");
vim.switchToInsertMode = () => switchMode("insert", "2px");

vim.switchToNormalMode();

let currentCommand = emptyCommand();

docs.keydown = function(e) {
    console.log(currentCommand)
    switch (vim.mode) {
        case 'normal':
            console.log(`NORMAL: ${e.key} - pressed`);
            eventToCommand(e);

            if (vim.needsInsert.includes(currentCommand[0])) {
                console.log(`Switch to insert: ${e.key} - pressed`);
                vim.switchToInsertMode();
                return true;
            }

            const move = moveCommand()
            if (move) {
                move.forEach((x) => x())
                currentCommand = emptyCommand();
                return true;
            }

            return normalCommands()
        case 'visual':
            console.log(`VISUAL: ${e.key} - pressed`);
            eventToCommand(e);
            return vim.visual_keydown(e)
        case 'insert':
            if (e.key === "Escape") {
                vim.switchToNormalMode();
            }
            return true;
        default:
            vim.mode = 'normal';
            currentCommand = emptyCommand();
    }
};

// Command handlers
const commandHandlers = {
    normal: {
        "i": () => vim.switchToInsertMode(),
        "v": () => vim.switchToVisualMode(),
        "u": () => docs.pressKey(90, true, false), // Ctrl + z
        "d": handleDeleteCommand,
        "c": handleChangeCommand,
        "y": handleYankCommand,
        "w": handleWordCommand,
        "g": handleGotoCommand,
        "G": () => docs.pressKey(35, true, false), // Ctrl + End
        "p": handlePutCommand
    },
    visual: {
        "Escape": () => vim.switchToNormalMode(),
        "y": handleVisualYank,
        "d": handleVisualDelete,
        "c": handleVisualChange,
        "g": handleVisualGotoCommand,
        "G": () => docs.pressKey(35, true, true) // Ctrl + Shift + End
    }
};

function repeat(func, nrep = null) {
    let n;
    if (nrep) {
        n = nrep;
    } else {
        n = currentCommand[1];
    }
    for (let i = 0; i < n; i++) {
        console.log(func)
        func()
    }
}

function emptyCommand() {
    return ["", 1, ""];
}

function normalCommands() {
    switch (currentCommand[0]) {
        case "":
            return true;
        case "y":
            switch (currentCommand[2]) {
                case "":
                    return true;
                case "w":
                    yankWord()
                    currentCommand = emptyCommand();
                    return true;
                case "y":
                    yankLine()
                    currentCommand = emptyCommand();
                    return true;
                default:
                    currentCommand = emptyCommand();
                    return false;
            }
        case "d":
            break;
        case "c":
            break;
        case "g":
        case "G":
        default:
            currentCommand = emptyCommand();
            return false;
    }
}

function moveCommand() {
    let keyPresses = [];
    vim.keyMaps[currentCommand[0]]?.forEach(([key, ...args]) => {
        keyPresses.push(() => docs.pressKey(docs.codeFromKey(key), ...args))
    });
    if (keyPresses.length === 0) {
        return null;
    }
    return keyPresses;
}


function handleGotoCommand() {
    if (vim.currentSequence === "g") {
        vim.currentSequence = "";
        docs.pressKey(36, true, false); // Ctrl + Home
        return true;
    } else {
        vim.currentSequence = "g";
        return true;
    }
}

function handlePutCommand() {
    docs.clip.readText()
        .then(cltxt => docs.pasteText(cltxt))
        .catch(() => console.log("paste failed"));
    return true;
}

function handleVisualYank() {
    docs.cdoc.execCommand("copy");
    vim.switchToNormalMode();
    highlightBriefly();
    return true;
}

function handleVisualDelete() {
    vim.switchToNormalMode();
    highlightBriefly();
    setTimeout(() => docs.cdoc.execCommand("cut"), 50);
    return true;
}

function handleVisualChange() {
    highlightBriefly();
    setTimeout(() => {
        docs.pressKey(46); // Delete key
        vim.switchToInsertMode();
    }, 50);
    return true;
}

function handleVisualGotoCommand() {
    if (vim.currentSequence === "g") {
        vim.currentSequence = "";
        docs.pressKey(36, true, true); // Ctrl + Shift + Home
        return true;
    } else {
        vim.currentSequence = "g";
        return true;
    }
}

// Helper functions
function deleteLine() {
    docs.pressKey(38, true, false);
    docs.pressKey(40, true, true);
    docs.cdoc.execCommand("copy");
    highlightBriefly();
    setTimeout(() => docs.pressKey(46), 50);
}

function yankLine() {
    docs.pressKey(40, true, false);
    docs.pressKey(38, true, false);
    repeat(() => docs.pressKey(40, true, true))
    docs.cdoc.execCommand("copy");
    const nrep = currentCommand[1]
    highlightBriefly();
    setTimeout(() => repeat(() => docs.pressKey(38, true, true), nrep), 50);
}

function yankWord() {
    repeat(() => docs.pressKey(39, true, true))
    docs.cdoc.execCommand("copy");
    const nrep = currentCommand[1]
    highlightBriefly();
    setTimeout(() => repeat(() => docs.pressKey(37, true, true), nrep), 50);
}

function deleteWord() {
    docs.pressKey(39, true, true);
    docs.cdoc.execCommand("copy");
    highlightBriefly();
    setTimeout(() => docs.pressKey(46), 50);
}

function changeWord() {
    docs.pressKey(39, true, true);
    highlightBriefly();
    setTimeout(() => {
        docs.pressKey(46);
        vim.switchToInsertMode();
    }, 50);
}

function moveWord() {
    docs.pressKey(39, true, false);
    docs.pressKey(39, true, false);
    docs.pressKey(37, true, false);
}

function highlightBriefly() {
    docs.setColor("red");
    setTimeout(() => docs.setColor("black"), 50);
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

// Key handlers
vim.normal_keydown = function(e) {

    const handler = commandHandlers.normal[e.key];
    if (handler) return handler();

    if (e.key.match(/\d+/)) {
        vim.num += e.key.toString();
    }

    vim.keyMaps[e.key]?.forEach(([key, ...args]) => {
        const numRepeats = parseInt(vim.num) || 1;
        for (let i = 0; i < numRepeats; i++) {
            docs.pressKey(docs.codeFromKey(key), ...args);
        }
        vim.num = "";
        vim.currentSequence = "";
    });

    if (vim.needsInsert.includes(e.key)) {
        console.log(`Switch to insert: ${e.key} - pressed`);
        vim.switchToInsertMode();
        return true;
    }

    return false;
};

vim.visual_keydown = function(e) {

    const handler = commandHandlers.visual[e.key];
    if (handler) return handler();

    if (e.key.match(/\d+/)) {
        vim.num += e.key.toString();
    }

    vim.keyMaps[e.key]?.forEach(([key, ...args]) => {
        const numRepeats = parseInt(vim.num) || 1;
        for (let i = 0; i < numRepeats; i++) {
            if (key.indexOf("Arrow") === 0) {
                const keyArgs = [...args, false, true].slice(0, 2);
                docs.pressKey(docs.codeFromKey(key), ...keyArgs);
            } else {
                docs.pressKey(docs.codeFromKey(key), ...args);
                vim.switchToNormalMode();
            }
        }
        vim.num = "";
    });

    return false;
};
