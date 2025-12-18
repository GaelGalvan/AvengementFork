# Avengement LLM AI Opponent - Complete Implementation

## 🎯 Overview

You now have a fully functional LLM-powered AI opponent system for Avengement that uses Ollama to analyze board states and make strategic moves.

## 📦 What Was Created

### Backend Components

1. **ollamaServer.js** - Express.js backend server
   - Port: 3001
   - Connects to local Ollama instance (port 11434)
   - Endpoints for single and batch move evaluation
   - Board state formatting for LLM processing
   - Response parsing to extract recommended moves

2. **package.json** - Node.js dependencies
   - express, cors, node-fetch
   - Run: `npm install` then `npm start`

### Frontend Components

3. **boardStateAnalyzer.js** - Board analysis module
   - Analyzes current board positions
   - Detects threats and opportunities
   - Formats data for LLM consumption
   - Evaluates move quality

4. **aiOpponent.js** - AI manager module
   - Communicates with backend
   - Caches move evaluations
   - Handles difficulty levels
   - Status display integration

### Game Integration

5. **gameManager.js** - Updated with AI support
   - `setPlayerAI(playerNum, enabled)` - Enable/disable AI for players
   - `getAIMove(piece)` - Request AI move recommendation
   - `executeAITurn()` - Run full AI turn
   - Automatic AI turn execution

6. **app.js** - Updated with UI handlers
   - AI checkbox listeners
   - Difficulty selector integration
   - AI control panel integration

7. **game.html** - Updated UI
   - AI opponent control panel
   - Status indicator
   - Difficulty selector
   - Backend connection status

### Documentation

8. **AI_SETUP.md** - Comprehensive setup guide
   - Prerequisites and installation
   - Step-by-step instructions
   - Architecture explanation
   - Customization guide
   - Troubleshooting

9. **QUICK_START.md** - Quick reference
   - 5-minute setup
   - Key commands
   - API reference
   - Debug commands

10. **model_manager.py** - Python helper tool
    - Interactive Ollama model manager
    - Download and test models
    - Update backend configuration

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install Ollama
```bash
# Download from https://ollama.ai
ollama pull mistral
```

### Step 2: Install & Start Backend
```bash
cd ai-backend
npm install
npm start
# Server will run on http://localhost:3001
```

### Step 3: Use in Game
- Open `game.html` in browser
- Look for "🟢 AI Ready" indicator
- Check "Player 2 (AI)" checkbox
- Select difficulty level
- Play against the AI!

## 🧠 How It Works

### Move Evaluation Flow

```
1. Player moves → Game detects AI turn
   ↓
2. AI Opponent Module calls Backend
   • Sends: Current board state, valid moves, piece info
   ↓
3. Backend (ollamaServer.js)
   • Formats board state as readable text
   • Creates strategic prompt
   • Sends to Ollama API
   ↓
4. LLM (Ollama) Analysis
   • Analyzes position
   • Considers threats and opportunities
   • Evaluates each move
   • Recommends best move
   ↓
5. Backend Response
   • Parses LLM response
   • Extracts recommended move (x, y)
   • Returns with reasoning
   ↓
6. Game Execution
   • Move validated
   • Piece moved on board
   • UI updated
   • Next turn starts
```

### Strategy Prompt Sent to LLM

The AI receives prompts like:

```
You are a strategic game AI. Analyze this board position and recommend the best move.

BOARD STATE:
[ALLY Fighter HP:7 at (0,0)] [ALLY Ranger HP:4 at (2,0)]
[BOSS Dragon HP:30 at (3,3)]
[ENEMY Fighter HP:7 at (6,6)] [ENEMY Ranger HP:4 at (4,6)]

YOUR POSITION: Team A (ALLY - top-left), playing as a Fighter at (0,0)

AVAILABLE MOVES:
Valid moves from (0,0): (1,0), (2,0), (1,1), (0,1), (0,2), ...

STRATEGY GOALS:
1. Attack enemy pieces when possible and safe
2. Move closer to the opponent's spawn (bottom-right)
3. Protect yourself from the Boss (center)
4. Avoid isolated positions

TASK: Recommend ONE best move. Format: BEST_MOVE: (x,y)
```

## ⚙️ Key Features

### Difficulty Levels

- **Easy**: AI makes suboptimal moves 40% of the time
- **Medium**: AI makes suboptimal moves 20% of the time (default)
- **Hard**: AI always picks best move

### Performance

- First move: ~3-5 seconds (LLM loading into GPU)
- Subsequent moves: ~1-2 seconds (cached model)
- Backend caches recent evaluations to reduce API calls

### Customization

All LLM parameters adjustable:

```javascript
// In ollamaServer.js
temperature: 0.7,  // 0=predictable, 1=random
top_p: 0.9         // 0=conservative, 1=creative
```

## 🎮 Game Controls

### Enable AI

In the right sidebar:
- ☐ Player 1 (AI) - Makes Player 1 AI-controlled
- ☐ Player 2 (AI) - Makes Player 2 AI-controlled

### Difficulty
- Dropdown selector: Easy / Medium / Hard

### Status
- Green indicator: Backend connected and ready
- Red indicator: Ollama or backend not running
- Yellow indicator: AI is thinking

## 🔍 Files Structure

```
Avengement/
├── game.html                      (UI + AI controls)
│
├── ai-backend/
│   ├── ollamaServer.js           (Express backend, main AI logic)
│   ├── package.json              (Node dependencies)
│   ├── AI_SETUP.md               (Detailed guide)
│   ├── QUICK_START.md            (Quick reference)
│   ├── model_manager.py          (Model management tool)
│   └── node_modules/             (Dependencies, created after npm install)
│
├── scripts/game/
│   ├── boardState.js             (Unchanged)
│   ├── boardStateAnalyzer.js     (NEW: Board analysis)
│   ├── aiOpponent.js             (NEW: AI manager)
│   ├── gameManager.js            (UPDATED: AI integration)
│   ├── champion.js               (Unchanged)
│   ├── app.js                    (UPDATED: UI handlers)
│   ├── utils.js                  (Unchanged)
│   └── champions/
│       ├── fighter.js            (Unchanged)
│       ├── ranger.js             (Unchanged)
│       └── bossDragon.js         (Unchanged)
│
└── styles/
    └── main.css                  (Unchanged)
```

## 🛠️ Backend API

### Health Check
```
GET /health
Response: { status: 'ok', model: 'mistral' }
```

### Single Move Evaluation
```
POST /api/best-move
Body: {
  boardState: {...},
  teamColor: 'A' or 'B',
  pieceType: 'Fighter' or 'Ranger',
  currentPos: [x, y],
  allValidMoves: [[x1,y1], [x2,y2], ...]
}
Response: {
  success: true,
  recommendation: [x, y],
  reasoning: "Move toward enemy and attack...",
  allValidMoves: [...]
}
```

### Batch Evaluation
```
POST /api/evaluate-positions
Body: { positions: [pos1, pos2, ...] }
Response: { evaluations: [eval1, eval2, ...] }
```

## 🧩 Integration Points

### In gameManager.js
```javascript
// Enable AI for a player
window.GameManager.setPlayerAI(2, true);

// Get AI recommendation
const aiMove = await window.GameManager.getAIMove(piece);

// Execute full AI turn
window.GameManager.executeAITurn();
```

### In game.html UI
```html
<input type="checkbox" id="aiPlayer1" />
<input type="checkbox" id="aiPlayer2" />
<select id="aiDifficulty">
  <option value="easy">Easy</option>
  <option value="medium">Medium</option>
  <option value="hard">Hard</option>
</select>
```

## 💡 Customization Guide

### Change LLM Model

Edit `ai-backend/ollamaServer.js`:
```javascript
const MODEL = 'mistral'; // → 'llama2', 'neural-chat', etc.
```

Or use Python helper:
```bash
python ai-backend/model_manager.py
# Then select: 4 (Update backend model)
```

### Modify Strategy

Edit `buildPrompt()` in `ollamaServer.js`:

```javascript
function buildPrompt(boardDescription, teamColor, movesDescription, ...) {
  return `You are a ${personalityType} AI...
  
  STRATEGY GOALS:
  1. Your custom goal 1
  2. Your custom goal 2
  ...`;
}
```

### Adjust LLM Behavior

In `callOllama()` function:
```javascript
temperature: 0.7,  // Lower = more predictable
top_p: 0.9,        // Lower = more conservative
```

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| "AI Offline" in sidebar | Start Ollama: `ollama serve` then backend: `npm start` |
| Moves very slow | Try faster model: `ollama pull mistral` |
| AI makes bad moves | Adjust strategy in `buildPrompt()` |
| Backend crashes | Check `npm install` done and logs in terminal |
| Port 3001 in use | Change PORT in `ollamaServer.js` or kill process |

## 📊 Performance Expectations

- **Setup time**: ~5 minutes
- **First move**: 3-5 seconds (initial LLM load)
- **Typical moves**: 1-2 seconds
- **Model sizes**: 3B-46B parameters depending on choice
- **Memory**: 4-16GB depending on model

## 🔮 Future Enhancements

- [ ] Multi-model comparison UI
- [ ] Move history/replay system
- [ ] AI personality variants
- [ ] Self-play training data collection
- [ ] Fine-tuned models on game data
- [ ] WebSocket for faster communication
- [ ] Streaming LLM responses
- [ ] Advanced game analysis

## 📚 Resources

- **Ollama**: https://ollama.ai
- **Express.js**: https://expressjs.com
- **Mistral Model**: https://mistral.ai
- **LLaMA Models**: https://www.llama.com

## ✅ Verification Checklist

- [ ] Ollama installed and running
- [ ] Model downloaded (mistral)
- [ ] Node.js 14+ installed
- [ ] Dependencies installed: `npm install` in ai-backend/
- [ ] Backend server running: `npm start` in ai-backend/
- [ ] game.html opens without errors
- [ ] "🟢 AI Ready" indicator visible
- [ ] AI checkboxes respond to clicks
- [ ] Difficulty selector works
- [ ] AI makes moves when enabled

## 🎉 Next Steps

1. **Play**: Enable AI and play against it
2. **Experiment**: Try different difficulty levels
3. **Customize**: Modify strategy prompts
4. **Analyze**: Use browser console to debug
5. **Optimize**: Fine-tune LLM parameters

---

**Your LLM AI opponent is ready to play!** 🤖♟️

For detailed setup: See `ai-backend/AI_SETUP.md`
For quick start: See `ai-backend/QUICK_START.md`
