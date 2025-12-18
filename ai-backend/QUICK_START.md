# Avengement AI - Quick Reference

## Installation (5 minutes)

```bash
# 1. Install & start Ollama
ollama pull mistral

# 2. Install backend dependencies
cd ai-backend
npm install

# 3. Start backend server
npm start
# Server runs on http://localhost:3001

# 4. Open game.html in browser
# Check "🟢 AI Ready" appears in right sidebar
```

## Enable AI Opponent

1. Open `game.html`
2. In right sidebar under "LLM AI Opponent":
   - ☑ Player 1 (AI) - Makes Player 1 AI-controlled
   - ☑ Player 2 (AI) - Makes Player 2 AI-controlled
3. Select difficulty: Easy / Medium / Hard
4. Play! AI will move on its turn

## Architecture

```
Browser (game.html)
    ↓
boardStateAnalyzer.js  ← Analyzes position
    ↓
aiOpponent.js          ← Manages AI
    ↓
ollamaServer.js (Node) ← Format + call LLM
    ↓
Ollama API
    ↓
LLM (mistral/llama2)   ← Strategic analysis
```

## Key Files

| File | Purpose |
|------|---------|
| `ai-backend/ollamaServer.js` | Express backend, LLM integration |
| `scripts/game/aiOpponent.js` | Frontend AI manager |
| `scripts/game/boardStateAnalyzer.js` | Board state formatting |
| `scripts/game/gameManager.js` | Game logic + AI turns |
| `game.html` | UI (added AI controls) |

## API Endpoints (localhost:3001)

```
GET  /health
     → Returns: { status: 'ok', model: 'mistral' }

POST /api/best-move
     → Body: { boardState, teamColor, allValidMoves, ... }
     → Response: { recommendation: [x,y], reasoning: "..." }

POST /api/evaluate-positions
     → Batch evaluation of multiple positions
```

## Environment Setup

**Requirements**:
- Ollama running on `http://localhost:11434`
- Backend running on `http://localhost:3001`
- Node.js 14+

**Verify setup**:
```bash
# Check Ollama
curl http://localhost:11434

# Check Backend
curl http://localhost:3001/health
```

## Customize Strategy

Edit `ai-backend/ollamaServer.js`:

### Change LLM Model (line ~13)
```javascript
const MODEL = 'mistral'; // → 'llama2', 'neural-chat', etc.
```

### Modify Strategy Prompt (buildPrompt function)
```javascript
return `You are a strategic game AI...
STRATEGY GOALS:
1. Attack enemies
2. Move toward opponent
3. Avoid boss
4. [ADD MORE GOALS HERE]`;
```

### Adjust LLM Behavior (callOllama function)
```javascript
temperature: 0.7,  // 0=predictable, 1=creative
top_p: 0.9        // Higher = more diverse
```

## Difficulty Levels

- **Easy**: 40% chance AI makes suboptimal move
- **Medium**: 20% chance AI makes suboptimal move (default)
- **Hard**: AI always picks best move

## Debug Commands (Browser Console)

```javascript
// Check AI status
window.AIOpponent.enabled
window.AIOpponent.thinking

// Get board state
window.BoardStateAnalyzer.getBoardState()

// Clear AI cache
window.AIOpponent.clearCache()

// Manually test move evaluation
const piece = window.GameManager.players[1].pieces[0];
const moves = piece.validMoves(window.BoardState);
await window.AIOpponent.findBestMove(piece, moves);
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "AI Offline" | Start: `ollama serve` + `npm start` |
| Slow moves | Use `mistral` model (faster) |
| Bad strategy | Edit `buildPrompt()` in `ollamaServer.js` |
| Port error | Change PORT in `ollamaServer.js` |
| Dependencies missing | Run `npm install` in `ai-backend/` |

## Performance

- **First move**: ~3-5s (LLM loading)
- **Subsequent moves**: ~1-2s (cached model)
- **Different models**:
  - `mistral`: Fastest (recommended)
  - `neural-chat`: Balanced
  - `llama2`: Slowest but thoughtful

## Next Steps

1. Try different models: `ollama pull llama2`
2. Experiment with difficulty levels
3. Modify strategy in prompts
4. Add personality variations
5. Track AI performance over time

---

**For detailed setup**: See `AI_SETUP.md`
