const useQWERTY = true;
const directionalKeys = useQWERTY ? "hjkl" : "dhtn";
// top of page is ctrl + home, bottom is ctrl + end => will be different on mac
vim = {
    "mode": "insert", // Keep track of current mode
    "num": "", // Keep track of number keys pressed by the user
    "currentSequence": "", // Keep track of key sequences
    "escapeSequence": useQWERTY ? "jk" : "hn",
    "keyMaps": {
        "Backspace": [["ArrowLeft"]],
        "x": [["Delete"]],
        "b": [["ArrowLeft", true]], // ctrl + <-
        "e": [["ArrowRight", true]], // ctrl + ->
        // w is same behavior as eeb
        "w": [["ArrowRight", true], ["ArrowRight", true], ["ArrowLeft", true]],
        "a": [["ArrowRight"]],
        "A": [["ArrowDown", true]],
        "I": [["ArrowUp", true]],
        "$": [["ArrowDown", true]],
        "0": [["ArrowUp", true]],
        "o": [["ArrowDown", true], ["Enter"]],
        "O": [["ArrowUp", true], ["ArrowLeft"], ["Enter"]]
    },
    "needsInsert": ["a", "A", "I", "o", "O"]
};

vim.keyMaps[directionalKeys[0]] = [["ArrowLeft"]];
vim.keyMaps[directionalKeys[1]] = [["ArrowDown"]];
vim.keyMaps[directionalKeys[2]] = [["ArrowUp"]];
vim.keyMaps[directionalKeys[3]] = [["ArrowRight"]];

vim.addKeyMappings = function(baseMap) {
    baseMap[vim.keys.move[0]] = "ArrowLeft";
    baseMap[vim.keys.move[1]] = "ArrowDown";
    baseMap[vim.keys.move[2]] = "ArrowUp";
    baseMap[vim.keys.move[3]] = "ArrowRight";
};

vim.switchToNormalMode = function() {
    vim.currentSequence = "";
    vim.mode = "normal";
    vim.num = "";
    docs.setCursorWidth("7px");
};

vim.switchToVisualMode = function() {
    vim.currentSequence = "";
    vim.mode = "visual";
    vim.num = "";
    docs.setCursorWidth("7px");
};

vim.switchToInsertMode = function() {
    vim.currentSequence = "";
    vim.mode = "insert";
    vim.num = "";
    docs.setCursorWidth("2px");
};

// Called in normal mode.
vim.normal_keydown = function(e) {
    console.log(`NORMAL: ${e.key} - pressed`);
    if (e.key.match(/F\d+/)) {
        // Pass through any function keys.
        return true;
    }

    e.preventDefault();
    e.stopPropagation();

    if (e.key == "i") {
        vim.switchToInsertMode();
        return true;
    }

    if (e.key == "v") {
        vim.switchToVisualMode();
        return true;
    }

    if (e.key == "u") {
        docs.pressKey(90, true, false); //Ctrl + z
        return true;
    }

    if (e.key == "d") {
        if (vim.currentSequence === "d") {
            vim.currentSequence = "";
            docs.pressKey(40, true, false);
            docs.pressKey(38, true, false); // to guarantee that cursor is at the start
            docs.pressKey(40, true, true); // Shift + down goes to end of the line
            docs.cdoc.execCommand("copy"); // Copy the line, cut doesn't work for some reason
            docs.setColor("red");
            setTimeout(() => {
                docs.setColor("black")
                docs.pressKey(46); // Delete key to remove the selected line
            }, 50)
            return true;
        } else {
            vim.currentSequence = "d";
            return true;
        }
    }

    if (e.key == "c") {
        if (vim.currentSequence === "c") {
            vim.currentSequence = "";
            docs.pressKey(40, true, false);
            docs.pressKey(38, true, false); // to guarantee that cursor is at the start
            docs.pressKey(40, true, true); // Shift + down goes to end of the line
            docs.setColor("red");
            setTimeout(() => {
                docs.setColor("black")
                docs.pressKey(46); // Delete key to remove the selected line
            }, 50)
            vim.switchToInsertMode()
            return true;
        } else {
            vim.currentSequence = "c";
            return true;
        }
    }

    /* Bring cursor back to original position???*/
    if (e.key == "y") {
        if (vim.currentSequence === "y") {
            vim.currentSequence = "";
            docs.pressKey(40, true, false);
            docs.pressKey(38, true, false); // to guarantee that cursor is at the start
            docs.pressKey(40, true, true); // Shift + down goes to end of the line/paragraph
            docs.cdoc.execCommand("copy");
            docs.setColor("red");
            setTimeout(() => {
                docs.setColor("black")
                docs.pressKey(38, true, true); // Up arrow to return to start of line
            }, 50)
            return true;
        } else {
            vim.currentSequence = "y";
            return true;
        }
    }

    //39 right, 37 left
    if (e.key == "w") {
        if (vim.currentSequence === "y") {
            vim.currentSequence = "";
            docs.pressKey(39, true, true)
            docs.cdoc.execCommand("copy")
            docs.setColor("red");
            setTimeout(() => {
                docs.setColor("black")
                docs.pressKey(37, true, true); // Up arrow to return to start of line
            }, 50)
            return true
        } else if (vim.currentSequence === "d") {
            vim.currentSequence = "";
            docs.pressKey(39, true, true); // Shift + down goes to end of the line
            docs.cdoc.execCommand("copy"); // Copy the line, cut doesn't work for some reason
            docs.setColor("red");
            setTimeout(() => {
                docs.setColor("black")
                docs.pressKey(46); // Delete key to remove the selected line
            }, 50)
            return true
        } else if (vim.currentSequence === "c") {
            vim.currentSequence = "";
            docs.pressKey(39, true, true); // Shift + down goes to end of the line
            docs.setColor("red");
            setTimeout(() => {
                docs.setColor("black")
                docs.pressKey(46); // Delete key to remove the selected line
            }, 50)
            vim.switchToInsertMode();
            return true

        } else {
            vim.currentSequence = "";
        }
    }

    if (e.key == "g") {
        if (vim.currentSequence === "g") {
            vim.currentSequence = "";
            docs.pressKey(36, true, false); // Ctrl + Home (go to start of document)
            return true;
        } else {
            vim.currentSequence = "g";
            return true;
        }
    }

    if (e.key == "G") {
        vim.currentSequence = "";
        docs.pressKey(35, true, false); // Ctrl + End (go to end of document)
        return true;
    }

    if (e.key == "p") {
        docs.clip.readText().then(
            (cltxt) => docs.pasteText(cltxt)
        ).catch(
            () => console.log("paste failed")
        )
        return true;
    }

    if (e.key.match(/\d+/)) {
        vim.num += e.key.toString();
    }

    vim.keyMaps[e.key]?.forEach(([key, ...args]) => {
        const numRepeats = parseInt(vim.num) || 1;
        for (let i = 0; i < numRepeats; i++) {
            docs.pressKey(docs.codeFromKey(key), ...args);
        }
        vim.num = "";
    });

    if (vim.needsInsert.includes(e.key)) {
        console.log(`Switch to insert: ${e.key} - pressed`)
        vim.switchToInsertMode();
        return true;
    }

    return false;
};

// Called in visual mode.
vim.visual_keydown = function(e) {
    console.log(`VISUAL: ${e.key} - pressed`);
    if (e.key.match(/F\d+/)) {
        // Pass through any function keys.
        return true;
    }

    e.preventDefault();
    e.stopPropagation();

    if (e.key == "Escape") {
        // Escape visual mode.
        vim.switchToNormalMode();
        return false;
    }

    if (e.key == "y" || e.key == "d" || e.key == "c") {
        if (e.key == "y") {
            docs.cdoc.execCommand("copy");
            vim.switchToNormalMode();
            docs.setColor("red");
            setTimeout(() => docs.setColor("black"), 50)
            return true
        } else if (e.key == "d") {
            vim.switchToNormalMode();
            docs.setColor("red");
            setTimeout(() => {
                docs.setColor("black")
                docs.cdoc.execCommand("cut");
            }, 50)
            return true
        } else {
            docs.setColor("red");
            setTimeout(() => {
                docs.setColor("black")
                docs.pressKey(46); // Delete key to remove the selected line
                vim.switchToInsertMode();
            }, 50)
            return true
        }
    }

    if (e.key.match(/\d+/)) {
        vim.num += e.key.toString();
    }

    if (e.key == "g") {
        if (vim.currentSequence === "g") {
            vim.currentSequence = "";
            docs.pressKey(36, true, true); // Ctrl + Shift + Home (select to start of document)
            return true;
        } else {
            vim.currentSequence = "g";
            return true;
        }
    }

    if (e.key == "G") {
        vim.currentSequence = "";
        docs.pressKey(35, true, true); // Ctrl + Shift + End (select to end of document)
        return true;
    }

    //moving
    vim.keyMaps[e.key]?.forEach(([key, ...args]) => {
        const numRepeats = parseInt(vim.num) || 1;
        for (let i = 0; i < numRepeats; i++) {
            if (key.indexOf("Arrow") == 0) {
                // get the special keys pressed and default to false
                const keyArgs = [...args, false, false].slice(0, 2);
                keyArgs[1] = true;
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

vim.insert_keydown = function(e) {
    if (e.key == "Escape") {
        vim.switchToNormalMode();
    }

    vim.currentSequence += e.key;
    if (vim.currentSequence == vim.escapeSequence) {
        e.preventDefault();
        e.stopPropagation();

        // We need to delete the first character already typed in the escape
        // sequence.
        for (var i = 0; i < (vim.currentSequence.length - 1); i++) {
            docs.backspace();
        }

        vim.switchToNormalMode();
        return false;
    }
    if (vim.escapeSequence.indexOf(vim.currentSequence) != 0) {
        vim.currentSequence = e.key;
    }
};

docs.keydown = function(e) {
    if (vim.mode == "insert") {
        return vim.insert_keydown(e);
    }
    if (vim.mode == "normal") {
        return vim.normal_keydown(e);
    }
    if (vim.mode == "visual") {
        return vim.visual_keydown(e);
    }
};
