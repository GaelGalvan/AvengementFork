# Avengement LLM AI Opponent Setup Guide

This guide explains how to set up and run the LLM-powered AI opponent using Ollama.

## 📋 Prerequisites

- **Ollama** (https://ollama.ai) - LLM inference engine
- **Node.js 14+** - For the Express backend server
- **npm** - Node package manager

## 🚀 Quick Start

### Step 1: Install Ollama

1. Download and install from https://ollama.ai
2. Start Ollama (it will run on `http://localhost:11434`)
3. Pull a model:
   ```bash
   ollama pull mistral
   # or try other models:
   ollama pull llama2
   ollama pull neural-chat
   ```

### Step 2: Install Backend Dependencies

```bash
cd ai-backend
npm install
```

This installs:
- `express` - Web server
- `cors` - Cross-origin support
- `node-fetch` - HTTP client for Ollama API

### Step 3: Start the AI Backend Server

```bash
# From ai-backend/ directory
npm start
# or: node ollamaServer.js
```

You should see:
```
╔════════════════════════════════════════╗
║  Avengement LLM AI Backend (Ollama)    ║
║  Running on http://localhost:3001      ║
║  Model: mistral                        ║
║  Ollama: http://localhost:11434        ║
╚════════════════════════════════════════╝
```

### Step 4: Run the Game

1. Open `game.html` in a browser (or run a local server)
2. You should see "🟢 AI Ready" in the right sidebar
3. Check the "Player 2 (AI)" checkbox to enable AI opponent
4. Play! The AI will think about its moves when it's Player 2's turn

## 🎮 Using the AI Opponent

### Enable AI for Players

In the right sidebar under **LLM AI Opponent**:
- Check "Player 1 (AI)" to make Player 1 AI-controlled
- Check "Player 2 (AI)" to make Player 2 AI-controlled

### Difficulty Levels

- **Easy (40% mistakes)** - AI makes suboptimal moves 40% of the time
- **Medium (20% mistakes)** - AI makes suboptimal moves 20% of the time (default)
- **Hard (Perfect play)** - AI always picks the best move

## 🔧 Architecture

### Components

1. **ollamaServer.js** (Node.js Backend)
   - Express server on port 3001
   - Connects to local Ollama instance
   - Endpoints:
     - `GET /health` - Server status
     - `POST /api/best-move` - Evaluate single position
     - `POST /api/evaluate-positions` - Batch evaluation

2. **boardStateAnalyzer.js** (Frontend)
   - Analyzes board state
   - Generates board descriptions for LLM
   - Exports: `window.BoardStateAnalyzer`

3. **aiOpponent.js** (Frontend AI Manager)
   - Calls backend for move recommendations
   - Caches evaluations
   - Exports: `window.AIOpponent`

4. **gameManager.js** (Updated)
   - Integrates AI turns
   - Handles player AI flags
   - New methods: `setPlayerAI()`, `findBestMove()`, `executeAITurn()`

### Data Flow

```
Game → AI Opponent Module
  ↓ (Board State)
Backend Server
  ↓ (Format for LLM)
Ollama LLM (mistral/llama2/etc)
  ↓ (Strategic analysis)
Backend (Parse response)
  ↓ (Recommended move)
Game (Execute move)
```

## 📊 How the AI Works

1. **Board Analysis**: Current positions of all pieces, health, threats
2. **Strategy Prompt**: LLM analyzes valid moves using game strategy
3. **Move Evaluation**: LLM rates moves based on:
   - Attacking enemy pieces
   - Moving toward opponent spawn
   - Avoiding the Boss
   - Maintaining safe positions
4. **Move Selection**: Response parsed for best move in format: `BEST_MOVE: (x,y)`

### Example Prompt Sent to LLM

```
You are a strategic game AI. Analyze this board position and recommend the best move.

BOARD STATE:
[ALLY Fighter HP:7 at (0,0)] [ALLY Ranger HP:4 at (2,0)]
[BOSS Dragon HP:30 at (3,3)]
[ENEMY Fighter HP:7 at (6,6)] [ENEMY Ranger HP:4 at (4,6)]

YOUR POSITION: Team A (ALLY - top-left), playing as a Fighter at (0,0)

AVAILABLE MOVES:
Valid moves from (0,0): (1,0), (2,0), (1,1), (0,1), (0,2), (1,2), (2,1), (2,2)

STRATEGY GOALS:
1. Attack enemy pieces when possible and safe
2. Move closer to the opponent's spawn (bottom-right)
3. Protect yourself from the Boss (center)
4. Avoid isolated positions

TASK: Recommend ONE best move from the valid moves list.
Format your response as: BEST_MOVE: (x,y)
Then briefly explain why (1-2 sentences).
```

## 🛠️ Customization

### Change the LLM Model

Edit `ai-backend/ollamaServer.js`, line ~13:

```javascript
const MODEL = 'mistral'; // Change this
```

Available models:
- `mistral` - Fast, capable (default)
- `llama2` - Slower, more thoughtful
- `neural-chat` - Conversation-optimized
- `dolphin-mixtral` - Expert reasoning

Pull new models with:
```bash
ollama pull dolphin-mixtral
```

### Adjust Strategy Prompts

Edit the `buildPrompt()` function in `ai-backend/ollamaServer.js` to change:
- Strategy priorities
- Goal weighting
- Context information sent to LLM

### Increase/Decrease Response Time

Edit cache timeout or reduce LLM temperature in `ollamaServer.js`:

```javascript
body: JSON.stringify({
  model: MODEL,
  prompt: prompt,
  stream: false,
  temperature: 0.7,  // Lower = more deterministic, Higher = more creative
  top_p: 0.9
})
```

## 🐛 Troubleshooting

### AI Backend Shows "Offline"

**Problem**: "🔴 AI Offline" in sidebar

**Solutions**:
1. Check Ollama is running: `ollama serve`
2. Check backend is running: `node ai-backend/ollamaServer.js`
3. Verify ports:
   - Ollama: http://localhost:11434
   - Backend: http://localhost:3001
4. Check browser console (F12) for error details

### Moves Take Too Long

**Solutions**:
1. Switch to faster model: `ollama pull mistral`
2. Reduce temperature (less thinking): Edit `ollamaServer.js`
3. Check Ollama logs for warnings
4. Run on GPU (if available) for faster inference

### AI Makes Bad Moves

**Solutions**:
1. Try different LLM model: `llama2`, `neural-chat`
2. Adjust strategy prompts in `buildPrompt()`
3. Increase difficulty to "Hard" for better play
4. Add game-specific knowledge to prompts

### Backend Crashes

Check logs for errors:
```bash
# Terminal output will show
Error: [error message]
```

Common issues:
- Ollama not running → Start Ollama
- Port 3001 in use → Kill process or change PORT in script
- Missing dependencies → Run `npm install`

## 📈 Performance Tips

- **First move slower**: LLM loading in VRAM
- **Subsequent moves faster**: Model stays in memory
- **Batch evaluation** (multiple pieces) faster than individual
- **Smaller models** (mistral) vs larger (llama2) trade quality for speed

## 🎓 Advanced Usage

### Debug AI Decisions

Open browser console (F12) and:

```javascript
// Check if AI is enabled
window.AIOpponent.enabled

// Get cached moves
window.AIOpponent.clearCache()

// Manually request AI move
const piece = window.GameManager.players[1].pieces[0];
const moves = piece.validMoves(window.BoardState);
await window.AIOpponent.findBestMove(piece, moves);
```

### Modify Board State Analysis

Edit `scripts/game/boardStateAnalyzer.js`:
- `_analyzeThreat()` - Change threat detection
- `_analyzeOpportunities()` - Change opportunity detection
- `evaluateMove()` - Change move scoring

### Custom AI Personality

Modify prompts to add personality:

```javascript
// In buildPrompt() function
const prompt = `You are a ${personality} AI. ${original_prompt}`;
// personality could be: "aggressive", "defensive", "strategic", etc.
```

## 📝 File Structure

```
Avengement/
├── game.html (Updated with AI controls)
├── ai-backend/
│   ├── ollamaServer.js (Backend server)
│   ├── package.json (Dependencies)
│   └── AI_SETUP.md (This file)
├── scripts/game/
│   ├── boardStateAnalyzer.js (Board analysis)
│   ├── aiOpponent.js (AI manager)
│   ├── gameManager.js (Updated with AI)
│   ├── app.js (Updated with AI UI)
│   └── ... (other game files)
└── styles/
```

## 🚀 Next Steps

- Play against different difficulty levels
- Experiment with different LLM models
- Customize AI strategy prompts
- Add personality or playstyle variations
- Collect game data to fine-tune prompts

## 📞 Support

For issues with:
- **Ollama**: https://ollama.ai
- **Express.js**: https://expressjs.com
- **Game code**: Check console (F12) for errors

---

**Enjoy playing against the LLM AI!** 🤖♟️
