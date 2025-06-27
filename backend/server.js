const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // 🔥 Use env PORT for Render

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage (use database in production)
let gameStats = {
    totalGames: 0,
    playerWins: 0,
    computerWins: 0,
    ties: 0,
    recentGames: []
};

let leaderboard = [];

// Game logic
function playGame(playerChoice) {
    const choices = ['rock', 'paper', 'scissors'];
    const computerChoice = choices[Math.floor(Math.random() * 3)];

    let result;
    if (playerChoice === computerChoice) {
        result = 'tie';
        gameStats.ties++;
    } else if (
        (playerChoice === 'rock' && computerChoice === 'scissors') ||
        (playerChoice === 'paper' && computerChoice === 'rock') ||
        (playerChoice === 'scissors' && computerChoice === 'paper')
    ) {
        result = 'win';
        gameStats.playerWins++;
    } else {
        result = 'lose';
        gameStats.computerWins++;
    }

    gameStats.totalGames++;

    const gameData = {
        id: Date.now(),
        playerChoice,
        computerChoice,
        result,
        timestamp: new Date().toISOString()
    };

    gameStats.recentGames.unshift(gameData);
    if (gameStats.recentGames.length > 10) {
        gameStats.recentGames.pop();
    }

    return gameData;
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

app.get('/results', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'results.html'));
});

// API Routes
app.post('/api/play', (req, res) => {
    const { playerChoice, playerName } = req.body;

    if (!['rock', 'paper', 'scissors'].includes(playerChoice)) {
        return res.status(400).json({ error: 'Invalid choice' });
    }

    const gameResult = playGame(playerChoice);

    // Update leaderboard
    if (playerName) {
        let player = leaderboard.find(p => p.name === playerName);
        if (!player) {
            player = { name: playerName, wins: 0, losses: 0, ties: 0, totalGames: 0 };
            leaderboard.push(player);
        }

        player.totalGames++;
        if (gameResult.result === 'win') player.wins++;
        else if (gameResult.result === 'lose') player.losses++;
        else player.ties++;

        // Sort leaderboard by wins
        leaderboard.sort((a, b) => b.wins - a.wins);
    }

    res.json(gameResult);
});

app.get('/api/stats', (req, res) => {
    res.json(gameStats);
});

app.get('/api/leaderboard', (req, res) => {
    res.json(leaderboard.slice(0, 10)); // Top 10 players
});

app.post('/api/reset', (req, res) => {
    gameStats = {
        totalGames: 0,
        playerWins: 0,
        computerWins: 0,
        ties: 0,
        recentGames: []
    };
    leaderboard = [];
    res.json({ message: 'Stats reset successfully' });
});

// ✅ Fix: Bind to 0.0.0.0 for Render
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Rock Paper Scissors server running on port ${PORT}`);
    console.log(`📁 Make sure to create a 'public' folder with HTML files`);
});
