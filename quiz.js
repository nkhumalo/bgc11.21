// quiz.js: checks quiz answers and saves progress

const level = document.body.dataset.level;
const feedback = document.getElementById("feedback");
const explain = document.getElementById("explain");

document.querySelectorAll(".answer").forEach((button) => {
    button.addEventListener("click", () => {
        const box = button.querySelector(".box");

        if (button.dataset.correct === "true") {
            button.classList.add("correct");
            box.textContent = "✓";
            feedback.textContent = "Correct! Great job!";
            explain.hidden = false;
            localStorage.setItem("done-" + level, "yes");
        } else {
            button.classList.add("wrong");
            box.textContent = "✗";
            feedback.textContent = "Not quite, try again!";
        }
    });
});