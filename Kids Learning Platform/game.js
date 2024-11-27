//fix countdown timer message
//document better
//REMOVE DUPLICATES  CLEAN UP

let currentOperation = 'addition';
let currentDifficulty = 'easy';
let score = 0;
let streak = 0;
let totalAttempts = 0;
let timerActive = false;
let timeRemaining = 30;
let timerInterval;
let isMultiplayer = false;
let currentPlayer = 1;
let p1Score = 0;
let p2Score = 0;
let totalTime = 0;
let questionsStartTime;
let isMultiplayerRound = false;
let multiplayerTimer = 15;
let multiplayerInterval;

const backgroundMusic = document.getElementById('backgroundMusic');
const correctSound = document.getElementById('correctSound');
const wrongSound = document.getElementById('wrongSound');
const toggleMusicButton = document.getElementById('toggleMusic');
const volumeSlider = document.getElementById('volumeSlider');
let isMusicPlaying = false;

const difficultyRanges = {
    easy: { min: 1, max: 10 },
    medium: { min: 10, max: 25 },
    hard: { min: 25, max: 100 }
};

function toggleMusic() {
    if (isMusicPlaying) {
        backgroundMusic.pause();
        toggleMusicButton.textContent = '🔈 Music';
        toggleMusicButton.classList.add('muted');
    } else {
        backgroundMusic.play();
        toggleMusicButton.textContent = '🔊 Music';
        toggleMusicButton.classList.remove('muted');
    }
    isMusicPlaying = !isMusicPlaying;
}

// Add click event listener for the music toggle button
toggleMusicButton.addEventListener('click', toggleMusic);

// Set initial volume
backgroundMusic.volume = correctSound.volume = wrongSound.volume = 0.5;

function disableOptions(disable) {
    const options = document.querySelectorAll('.option-button');
    options.forEach(button => {
        button.style.pointerEvents = disable ? 'none' : 'auto';
        button.style.opacity = disable ? '0.7' : '1';
    });
}

function showCountdown(callback) {
    const countdownElement = document.getElementById('countdown');
    const counts = ['3', '2', '1', 'GO!'];
    let i = 0;

    // Disable options during countdown
    disableOptions(true);

    function showNumber() {
        if (i < counts.length) {
            countdownElement.textContent = counts[i];
            countdownElement.classList.add('show');
            setTimeout(() => {
                countdownElement.classList.remove('show');
                setTimeout(showNumber, 500);
            }, 1000);
            i++;
        } else {
            disableOptions(false); // Re--enable options after countdon
            callback();
        }
    }

    showNumber();
}

function updateReportData() {
    const accuracyPercentage = totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 0;
    const avgTime = totalAttempts > 0 ? Math.round(totalTime / totalAttempts) : 0;
    
    localStorage.setItem('accuracy', `${accuracyPercentage}%`);
    localStorage.setItem('questionsSolved', totalAttempts.toString());
    localStorage.setItem('avgTime', `${avgTime}s`);
}

function setOperation(operation) {
    currentOperation = operation;
    document.querySelectorAll('.controls button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    generateNewProblem();
}

function setDifficulty(difficulty) {
    currentDifficulty = difficulty;
    document.querySelectorAll('.difficulty-controls button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    generateNewProblem();
}

function generateNumber() {
    const range = difficultyRanges[currentDifficulty];
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

function generateNewProblem() {
    let num1 = generateNumber();
    let num2 = generateNumber();
    let problem, answer;

    if (currentOperation === 'division') {
        num1 = num1 * num2;
        problem = `${num1} ÷ ${num2}`;
        answer = num1 / num2;
    } else {
        problem = `${num1} ${getOperationSymbol()} ${num2}`;
        answer = calculateAnswer(num1, num2);
    }

    document.getElementById('problem').textContent = problem;
    generateOptions(answer);
    
    questionsStartTime = Date.now();
}

function getOperationSymbol() {
    switch (currentOperation) {
        case 'addition': return '+';
        case 'subtraction': return '-';
        case 'multiplication': return '×';
        case 'division': return '÷';
    }
}

function calculateAnswer(num1, num2) {
    switch (currentOperation) {
        case 'addition': return num1 + num2;
        case 'subtraction': return num1 - num2;
        case 'multiplication': return num1 * num2;
        case 'division': return num1 / num2;
    }
}

function generateOptions(correctAnswer) {
    const options = [correctAnswer];
    while (options.length < 4) {
        const offset = Math.floor(Math.random() * 5) + 1;
        const newOption = Math.random() < 0.5 ? correctAnswer + offset : correctAnswer - offset;
        if (!options.includes(newOption)) {
            options.push(newOption);
        }
    }

    options.sort(() => Math.random() - 0.5);

    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'option-button';
        button.textContent = option;
        button.onclick = () => checkAnswer(option, correctAnswer);
        optionsContainer.appendChild(button);
    });
}

function showFeedback(isCorrect) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = isCorrect ? '✓' : '✗';
    feedback.className = `feedback show ${isCorrect ? 'correct' : 'incorrect'}`;

    setTimeout(() => {
        feedback.className = 'feedback';
    }, 500);
}

function checkAnswer(selected, correct) {
    const isCorrect = selected === correct;
    totalAttempts++;
    
    const timeForQuestion = (Date.now() - questionsStartTime) / 1000;
    totalTime += timeForQuestion;

    if (isCorrect) {
        correctSound.play();
        score++;
        streak++;
        if (isMultiplayerRound) {
            if (currentPlayer === 1) {
                p1Score++;
            } else {
                p2Score++;
            }
            updateMultiplayerScores();
        }
    } else {
        wrongSound.play();
        streak = 0;
    }

    showFeedback(isCorrect);
    updateStats();
    updateReportData();
    generateNewProblem();
}

function updateStats() {
    document.getElementById('score').textContent = score;
    document.getElementById('streak').textContent = streak;
    document.getElementById('accuracy').textContent =
        `${Math.round((score / totalAttempts) * 100)}%`;
}

function toggleTimer() {
    timerActive = !timerActive;
    if (timerActive) {
        score = 0;
        timeRemaining = 30;
        updateTimer();
        timerInterval = setInterval(() => {
            timeRemaining--;
            updateTimer();
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                alert(`Game Over! Final Score: ${score}`);
                resetGame();
            }
        }, 1000);
    } else {
        clearInterval(timerInterval);
        document.getElementById('timer').textContent = 'Timer Off';
    }
}

function updateTimer() {
    document.getElementById('timer').textContent = `Time: ${timeRemaining}s`;
}

function toggleMultiplayer() {
    isMultiplayer = !isMultiplayer;
    const multiplayerArea = document.getElementById('multiplayer-area');
    
    if (isMultiplayer) {
        multiplayerArea.style.display = 'block';
        startMultiplayerRound();
    } else {
        multiplayerArea.style.display = 'none';
        if (multiplayerInterval) {
            clearInterval(multiplayerInterval);
        }
        resetGame();
    }
}

function startMultiplayerRound() {
    resetGame();
    currentPlayer = 1;
    p1Score = 0;
    p2Score = 0;
    updateMultiplayerScores();
    
    showCountdown(() => {
        startPlayerTurn();
    });
}

function startPlayerTurn() {
    multiplayerTimer = 15;
    updateMultiplayerTimer();
    isMultiplayerRound = true;
    
    multiplayerInterval = setInterval(() => {
        multiplayerTimer--;
        updateMultiplayerTimer();
        
        if (multiplayerTimer <= 0) {
            clearInterval(multiplayerInterval);
            handleTurnEnd();
        }
    }, 1000);
}

function updateMultiplayerTimer() {
    const timerElement = document.getElementById(`p${currentPlayer}-time`);
    timerElement.textContent = `${multiplayerTimer}s`;
}

function updateMultiplayerScores() {
    document.getElementById('p1-score').textContent = p1Score;
    document.getElementById('p2-score').textContent = p2Score;
}

function handleTurnEnd() {
    if (currentPlayer === 1) {
        currentPlayer = 2;
        const winnerAnnouncement = document.getElementById('winner-announcement');
        winnerAnnouncement.textContent = "Player 1 Done! Player 2 Get Ready!";
        winnerAnnouncement.classList.add('show');
        
        // Disable options during the transition
        disableOptions(true);
        
        setTimeout(() => {
            winnerAnnouncement.classList.remove('show');
            setTimeout(() => {
                showCountdown(() => {
                    startPlayerTurn();
                });
            }, 500);
        }, 5000); // Show message for 5 seconds
    } else {
        announceWinner();
    }
}

function announceWinner() {
    const winnerAnnouncement = document.getElementById('winner-announcement');
    let message;
    
    if (p1Score > p2Score) {
        message = `Player 1 Wins!\nScore: ${p1Score} vs ${p2Score}`;
    } else if (p2Score > p1Score) {
        message = `Player 2 Wins!\nScore: ${p2Score} vs ${p1Score}`;
    } else {
        message = `It's a Tie!\nScore: ${p1Score} vs ${p2Score}`;
    }
    
    winnerAnnouncement.textContent = message;
    winnerAnnouncement.classList.add('show');
    
    setTimeout(() => {
        winnerAnnouncement.classList.remove('show');
        isMultiplayer = false;
        document.getElementById('multiplayer-area').style.display = 'none';
        resetGame();
    }, 3000);
}

function resetGame() {
    score = 0;
    streak = 0;
    totalAttempts = 0;
    p1Score = 0;
    p2Score = 0;
    currentPlayer = 1;
    totalTime = 0;
    isMultiplayerRound = false;
    if (multiplayerInterval) {
        clearInterval(multiplayerInterval);
    }
    updateStats();
    updateReportData();
    updateMultiplayerScores();
    generateNewProblem();
}

volumeSlider.addEventListener('input', function() {
    const volume = this.value;
    backgroundMusic.volume = volume;
});

// Initialize the game
generateNewProblem();