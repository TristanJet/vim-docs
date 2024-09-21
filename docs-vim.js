const useQWERTY = true;
const directionalKeys = useQWERTY ? "hjkl" : "dhtn";
// top of page is ctrlfnhome, bottom is cctrlfnend => will be different on mac
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

    if (e.key == "g") {
        console.log("NORMAL: g - pressed")
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
        console.log("NORMAL: G - pressed")
        vim.currentSequence = "";
        docs.pressKey(35, true, false); // Ctrl + End (go to end of document)
        return true;
    }

    if (e.key == "p") {
        console.log("NORMAL: p pressed!")
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
    if (e.key.match(/F\d+/)) {
        // Pass through any function keys.
        return true;
    }

    if (e.key == "Escape") {
        // Escape visual mode.
        vim.switchToNormalMode();
        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    if (e.key == "y" || e.key == "d") {
        e.preventDefault();
        e.stopPropagation();
        if (e.key == "y") {
            console.log("VISUAL: y - pressed!");
            docs.cdoc.execCommand("copy");
            vim.switchToNormalMode();
            docs.setColor("red");
            setTimeout(() => docs.setColor("black"), 100)
            return true
        } else {
            console.log("VISUAL: d - pressed");
            docs.cdoc.execCommand("cut");
            vim.switchToNormalMode();
            return true
        }
    }

    e.preventDefault();
    e.stopPropagation();

    if (e.key.match(/\d+/)) {
        vim.num += e.key.toString();
    }

    if (e.key == "g") {
        console.log("VISUAL: g - pressed")
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
        console.log("VISUAL: G - pressed")
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
