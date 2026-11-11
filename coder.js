// coder.js: runs real Python in the browser using Pyodide

const level = document.body.dataset.level;
const codeBox = document.getElementById("code");
const output = document.getElementById("output");
const runButton = document.getElementById("run");
const resetButton = document.getElementById("reset");
const statusText = document.getElementById("status");
const hint = document.getElementById("hint");

const starterCode = codeBox.value;
const saveKey = "code-" + level;

// Sample writing used until a team saves their own on square 10
const DEFAULT_TEAM = {
    "Maya": [
        "OMG I literally cannot wait for Thanksgiving dinner!!",
        "My grandma's mac and cheese is literally the best thing ever!",
        "I'm so excited to see all my cousins, it's going to be amazing!",
        "Pie for breakfast? Yes please!!"
    ],
    "Jordan": [
        "Thanksgiving is an opportunity to reflect on gratitude and family.",
        "However, I believe the cranberry sauce is often underappreciated.",
        "Therefore, I will be preparing a homemade version this year.",
        "In conclusion, the holiday is meaningful for many reasons."
    ],
    "Zoe": [
        "ngl the turkey is kinda mid",
        "lol my uncle always falls asleep after dinner",
        "sweet potato pie tho. elite",
        "we watch football and eat until we cant move lol"
    ]
};

// Bring back the student's saved work
const saved = localStorage.getItem(saveKey);
if (saved) {
    codeBox.value = saved;
}

codeBox.addEventListener("input", () => {
    localStorage.setItem(saveKey, codeBox.value);
});

// Make the Tab key type 4 spaces instead of leaving the editor
codeBox.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
        event.preventDefault();
        codeBox.setRangeText("    ", codeBox.selectionStart, codeBox.selectionEnd, "end");
        localStorage.setItem(saveKey, codeBox.value);
    }
});

resetButton.addEventListener("click", () => {
    if (confirm("Start over with the original code?")) {
        codeBox.value = starterCode;
        localStorage.removeItem(saveKey);
    }
});

function show(text) {
    output.textContent += text + "\n";
}

// Load Python
let pyodide = null;
runButton.disabled = true;
output.textContent = "Loading Python... (this can take a few seconds)";

loadPyodide().then((py) => {
    pyodide = py;
    pyodide.setStdout({ batched: show });
    pyodide.setStderr({ batched: show });
    output.textContent = "Python is ready! Click Run Code.";
    runButton.disabled = false;
}).catch(() => {
    output.textContent = "Python couldn't load. Check your internet connection and refresh the page.";
});

// Run the student's code
runButton.addEventListener("click", async () => {
    output.textContent = "";
    statusText.textContent = "";
    statusText.className = "";
    hint.hidden = true;
    runButton.disabled = true;

    // A fresh, empty space for each run
    const space = pyodide.globals.get("dict")();
    space.set("_team_json", localStorage.getItem("team-writing") || JSON.stringify(DEFAULT_TEAM));

    try {
        // Load the team's writing so it's ready to use as team_writing
        await pyodide.runPythonAsync("import json\nteam_writing = json.loads(_team_json)", { globals: space });

        // Run any hidden setup code for this challenge
        const setup = document.getElementById("setup");
        if (setup) {
            await pyodide.runPythonAsync(setup.textContent, { globals: space });
        }

        // Run the student's code
        await pyodide.runPythonAsync(codeBox.value, { globals: space });

        // Check whether the mission is complete
        let passed = false;
        try {
            passed = pyodide.runPython(document.getElementById("check").textContent, { globals: space });
        } catch (checkError) {
            passed = false;
        }

        if (passed) {
            localStorage.setItem("done-" + level, "yes");

            // Square 10 saves the team's writing for the next challenges
            if (document.body.dataset.saveTeam) {
                const teamJson = pyodide.runPython("json.dumps(team_writing)", { globals: space });
                localStorage.setItem("team-writing", teamJson);
            }

            statusText.textContent = "Challenge complete! Head back to the board for the next square.";
            statusText.className = "pass";
        } else {
            statusText.textContent = "Your code ran, but the mission isn't finished yet. Check the hint below!";
            statusText.className = "fail";
            hint.hidden = false;
        }
    } catch (error) {
        // Show only the part of the error that's about the student's code
        const message = error.message;
        const start = message.indexOf('File "<exec>"');
        show("ERROR\n" + (start >= 0 ? message.slice(start) : message));
        statusText.textContent = "Uh oh, there's an error! The output box tells you which line to look at. Check your quotes, spelling, and spaces.";
        statusText.className = "fail";
        hint.hidden = false;
    }

    space.destroy();
    runButton.disabled = false;
});