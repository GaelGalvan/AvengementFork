# Avengement LLM AI Opponent System

**An intelligent game AI powered by Ollama that analyzes board positions and makes strategic moves in real-time.**

## 🎯 What This Does

This system adds a sophisticated LLM-powered AI opponent to the Avengement game that:

- **Analyzes board state** in real-time
- **Evaluates strategic options** using an LLM (via Ollama)
- **Recommends optimal moves** based on game strategy
- **Plays against human players** with adjustable difficulty
- **Caches decisions** for performance
- **Customizable strategy** prompts

## 🚀 Quick Start

### Requirements
- **Ollama** (https://ollama.ai) - LLM inference
- **Node.js 14+** - Backend server
- **mistral model** or similar (automatic download)

### 5-Minute Setup

```bash
# 1. Download & start Ollama
ollama pull mistral
ollama serve  # Keep running in separate terminal

# 2. Install backend
cd ai-backend
npm install

# 3. Start backend
npm start
# Server on http://localhost:3001

# 4. Open game.html
# Check "🟢 AI Ready" in sidebar
# Enable "Player 2 (AI)"
# Play!
```

**Windows users**: Double-click `ai-backend/start-backend.bat`

## 📋 What's Included

### Core Files

| File | Purpose |
|------|---------|
| `ai-backend/ollamaServer.js` | Express backend, LLM integration |
| `scripts/game/aiOpponent.js` | Frontend AI manager |
| `scripts/game/boardStateAnalyzer.js` | Board analysis engine |
| `scripts/game/gameManager.js` | Game logic + AI turns |
| `game.html` | UI with AI controls |

### Documentation

| File | Purpose |
|------|---------|
| `AI_IMPLEMENTATION_SUMMARY.md` | Complete technical overview |
| `ai-backend/AI_SETUP.md` | Detailed setup guide |
| `ai-backend/QUICK_START.md` | Quick reference card |

### Tools

| File | Purpose |
|------|---------|
| `ai-backend/start-backend.bat` | Windows batch launcher |
| `ai-backend/start-backend.ps1` | PowerShell launcher |
| `ai-backend/model_manager.py` | Ollama model manager |

## 🎮 How to Use

### Enable AI Opponent

1. Open `game.html` in browser
2. In right sidebar under "LLM AI Opponent":
   - ☐ Check "Player 1 (AI)" or "Player 2 (AI)"
   - Select difficulty: Easy / Medium / Hard
3. Play! AI will move on its turn

### Difficulty Levels

- **Easy**: AI makes optimal moves 60% of the time
- **Medium**: AI makes optimal moves 80% of the time (default)
- **Hard**: AI always makes best moves

## 🧠 How It Works

```
Player Move
    ↓
Game detects AI turn
    ↓
aiOpponent.js requests backend
    ↓
ollamaServer.js formats board state
    ↓
Send strategic prompt to Ollama
    ↓
LLM analyzes position
    ↓
Parse response for best move
    ↓
Execute move on board
```

### Strategic Analysis

The AI analyzes moves based on:
1. **Attacking opportunities** - Can it damage enemies?
2. **Positioning** - Moving toward opponent's base
3. **Threat avoidance** - Staying away from Boss and overwhelming enemies
4. **Safe plays** - Not moving into danger zones

## ⚙️ Architecture

### Backend (Node.js)
- **Port**: 3001
- **Framework**: Express.js
- **Purpose**: Interfaces with Ollama, formats prompts, parses responses

### Frontend (JavaScript)
- **boardStateAnalyzer.js**: Converts game state to text
- **aiOpponent.js**: Makes API calls, caches results
- **gameManager.js**: Executes AI turns

### LLM (Ollama)
- **Port**: 11434
- **Models**: mistral, llama2, neural-chat, etc.
- **Purpose**: Analyzes position and recommends moves

## 🔧 Customization

### Change LLM Model

Edit `ai-backend/ollamaServer.js`:
```javascript
const MODEL = 'mistral';  // Change to 'llama2', 'neural-chat', etc.
```

**Available models**:
- `mistral` - Fast, capable (recommended)
- `llama2` - Thoughtful, detailed analysis
- `neural-chat` - Conversation optimized
- `dolphin-mixtral` - Expert reasoning

Download with:
```bash
ollama pull llama2
```

### Customize Strategy

Edit `buildPrompt()` in `ollamaServer.js`:

```javascript
function buildPrompt(boardDescription, teamColor, ...) {
  return `You are a strategic game AI...
  
  STRATEGY GOALS:
  1. Attack enemies when safe
  2. Move toward opponent spawn
  3. Avoid the Boss
  4. [ADD YOUR CUSTOM GOALS]`;
}
```

### Adjust AI Behavior

In `callOllama()` function:
```javascript
temperature: 0.7,    // Lower = more predictable
top_p: 0.9,         // Lower = more conservative
```

## 📊 Performance

- **First move**: 3-5 seconds (LLM loads into GPU)
- **Typical moves**: 1-2 seconds (model cached)
- **Batch evaluation**: Faster for multiple pieces
- **Caching**: Recent moves cached to avoid redundant API calls

## 🐛 Troubleshooting

### "🔴 AI Offline"

**Solution**: Check both services running:
```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Start backend
cd ai-backend && npm start
```

### Moves take forever

**Solution**: Use faster model:
```bash
ollama pull mistral
```

Then edit `ai-backend/ollamaServer.js`:
```javascript
const MODEL = 'mistral';
```

### AI makes bad moves

**Solution**: Improve strategy prompt in `buildPrompt()` or increase difficulty

### Port 3001 already in use

**Solution**: Change PORT in `ai-backend/ollamaServer.js`:
```javascript
const PORT = 3002;  // Change to another port
```

## 📚 API Reference

### Health Check
```
GET http://localhost:3001/health
Returns: { status: 'ok', model: 'mistral' }
```

### Get Best Move
```
POST http://localhost:3001/api/best-move
Body: {
  boardState: {...},
  teamColor: 'A',
  pieceType: 'Fighter',
  currentPos: [0, 0],
  allValidMoves: [[1,0], [0,1], ...]
}
Returns: {
  success: true,
  recommendation: [1, 0],
  reasoning: "Move toward enemy..."
}
```

## 🔗 Integration Points

### In Your Game

```javascript
// Enable AI for a player
window.GameManager.setPlayerAI(2, true);

// Get AI move recommendation
const move = await window.GameManager.getAIMove(piece);

// Execute full AI turn
window.GameManager.executeAITurn();

// Get board state for analysis
window.BoardStateAnalyzer.getBoardState();
```

## 💡 Advanced Usage

### Debug Commands (Browser Console)

```javascript
// Check AI status
window.AIOpponent.enabled
window.AIOpponent.thinking

// Get current board analysis
const state = window.BoardStateAnalyzer.getBoardState();

// Clear move cache
window.AIOpponent.clearCache();

// Test move evaluation
const piece = window.GameManager.players[1].pieces[0];
const moves = piece.validMoves(window.BoardState);
await window.AIOpponent.findBestMove(piece, moves);
```

### Modify Move Analysis

Edit `scripts/game/boardStateAnalyzer.js`:
- `_analyzeTreats()` - Change threat detection
- `_analyzeOpportunities()` - Change opportunity detection
- `evaluateMove()` - Change move scoring

## 🚀 Performance Tips

1. **Use GPU acceleration**: Ollama will auto-detect and use GPU if available
2. **Smaller models**: `mistral` faster than `llama2`
3. **Batch operations**: Evaluate multiple pieces at once
4. **Cache warming**: First move slower, subsequent moves faster

## 📈 Next Steps

- [ ] Try different LLM models
- [ ] Experiment with difficulty levels
- [ ] Customize strategy prompts
- [ ] Analyze AI decision patterns
- [ ] Fine-tune for your playstyle
- [ ] Add personality variants

## 🤝 Contributing

To improve the AI:

1. **Test different models**: See which performs best
2. **Refine prompts**: Better strategy descriptions
3. **Analyze games**: What moves work/don't work?
4. **Experiment**: Try new parameters in LLM config

## 📞 Getting Help

**Issue**: Check these in order:
1. Read `ai-backend/QUICK_START.md`
2. Read `ai-backend/AI_SETUP.md`
3. Read `AI_IMPLEMENTATION_SUMMARY.md`
4. Check browser console (F12) for errors
5. Verify both Ollama and backend are running

## 📦 Requirements Summary

```
Ollama
├── Model (mistral, llama2, etc.)
└── Running on http://localhost:11434

Node.js
├── Express.js backend
├── Dependencies (npm install)
└── Running on http://localhost:3001

Browser
├── game.html
├── Scripts loaded
└── Backend connected
```

## 🎓 Learning Resources

- **Ollama**: https://ollama.ai - LLM documentation
- **Express.js**: https://expressjs.com - Web framework
- **LLaMA Models**: https://www.llama.com - Model info
- **Prompt Engineering**: Tips for better LLM responses

## 📝 File Changes Summary

**Created**:
- `ai-backend/ollamaServer.js`
- `ai-backend/package.json`
- `scripts/game/aiOpponent.js`
- `scripts/game/boardStateAnalyzer.js`
- `ai-backend/AI_SETUP.md`
- `ai-backend/QUICK_START.md`
- `ai-backend/start-backend.bat`
- `ai-backend/start-backend.ps1`
- `ai-backend/model_manager.py`
- `AI_IMPLEMENTATION_SUMMARY.md`

**Modified**:
- `scripts/game/gameManager.js` - Added AI support
- `game.html` - Added AI controls UI
- `scripts/game/app.js` - Added AI event handlers

## ✨ Features

- ✅ Real-time board analysis
- ✅ Strategic move evaluation
- ✅ Adjustable difficulty levels
- ✅ Move caching for performance
- ✅ Customizable LLM models
- ✅ Modifiable strategy prompts
- ✅ Status indicators
- ✅ Error handling
- ✅ Windows launchers
- ✅ Comprehensive documentation

## 🎉 You're Ready!

Your LLM AI opponent is fully set up and ready to play.

**Start here**: `ai-backend/QUICK_START.md`

---

**Enjoy playing against the AI!** 🤖♟️
