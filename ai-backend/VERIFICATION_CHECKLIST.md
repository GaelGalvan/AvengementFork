# ✅ Avengement AI - Setup Verification Checklist

Use this checklist to verify your LLM AI opponent setup is complete and working.

## 📦 Pre-Installation

- [ ] Ollama downloaded from https://ollama.ai
- [ ] Node.js 14+ installed (check: `node --version`)
- [ ] npm installed (check: `npm --version`)
- [ ] At least 4GB RAM available for LLM model

## 🎯 Ollama Setup

- [ ] Ollama installed and executable
- [ ] Ollama service running (`ollama serve` in terminal)
- [ ] Model downloaded: `ollama pull mistral`
- [ ] Can connect to http://localhost:11434
- [ ] Ollama shows "Listening on..." in terminal

## 📦 Backend Installation

- [ ] Navigate to `ai-backend/` directory
- [ ] Run: `npm install`
- [ ] node_modules folder created
- [ ] package-lock.json created
- [ ] No npm errors in output

## 🚀 Backend Execution

- [ ] Run: `npm start` from ai-backend/
- [ ] See banner with server info
- [ ] Server shows "Listening on http://localhost:3001"
- [ ] No errors in console output
- [ ] Terminal shows "Waiting for requests..."

## 🌐 Frontend Setup

- [ ] game.html file exists and intact
- [ ] Open game.html in modern browser (Chrome, Firefox, Edge)
- [ ] Page loads without errors (F12 → Console)
- [ ] Game board renders correctly
- [ ] No 404 errors for script files

## 🤖 AI System Check

### Status Indicator
- [ ] Right sidebar visible
- [ ] "LLM AI Opponent" panel visible
- [ ] Status shows "🟢 AI Ready" (green indicator)
- [ ] Backend connection message shows model name

### AI Controls
- [ ] "Player 1 (AI)" checkbox present and clickable
- [ ] "Player 2 (AI)" checkbox present and clickable
- [ ] Difficulty dropdown shows: Easy / Medium / Hard
- [ ] All controls respond to clicks

### Functionality
- [ ] Check "Player 2 (AI)" checkbox
- [ ] Checkbox state persists
- [ ] Start game by placing pieces
- [ ] Game initializes without errors
- [ ] Can select difficulty level

## 🧪 Functional Testing

### AI Move Execution
- [ ] Enable "Player 2 (AI)"
- [ ] Set difficulty to "Medium"
- [ ] Play a few moves as Player 1
- [ ] End Player 1's turn
- [ ] Player 2 (AI) makes a move
- [ ] Move completes within 5 seconds
- [ ] Move is within valid options
- [ ] Game log shows AI move

### Performance
- [ ] First AI move: 3-5 seconds (acceptable)
- [ ] Subsequent moves: 1-2 seconds
- [ ] No browser freeze/lag during thinking
- [ ] Browser console shows no errors

### All Difficulties
- [ ] Test with "Easy" difficulty
- [ ] Test with "Medium" difficulty
- [ ] Test with "Hard" difficulty
- [ ] All play without errors

## 📊 Data Verification

### Board State Analysis
In browser console (F12):
```javascript
window.BoardStateAnalyzer.getBoardState()
// Should return object with: size, grid, pieces, threats, opportunities
```
- [ ] Command executes without error
- [ ] Returns valid board state object
- [ ] Contains piece positions
- [ ] Contains threat/opportunity analysis

### AI Status
```javascript
window.AIOpponent.enabled
// Should return: true
```
- [ ] Returns `true` (enabled)
- [ ] Returns `false` (disabled) when backend offline

### GameManager
```javascript
window.GameManager.players
// Should show player data
```
- [ ] Returns valid player objects
- [ ] Shows AI flags if set
- [ ] Contains pieces array

## 🔧 Configuration Verification

### Backend Server
- [ ] `ollamaServer.js` exists in ai-backend/
- [ ] Contains: `const MODEL = 'mistral';`
- [ ] Contains: `const PORT = 3001;`
- [ ] Contains: `const OLLAMA_URL = 'http://localhost:11434';`

### Frontend Scripts
- [ ] `boardStateAnalyzer.js` in scripts/game/
- [ ] `aiOpponent.js` in scripts/game/
- [ ] `gameManager.js` updated with AI methods
- [ ] `app.js` updated with AI handlers

### HTML Integration
- [ ] game.html includes boardStateAnalyzer.js
- [ ] game.html includes aiOpponent.js
- [ ] game.html has aiPlayer1 checkbox
- [ ] game.html has aiPlayer2 checkbox
- [ ] game.html has aiDifficulty select

## 📋 Documentation Check

- [ ] QUICK_START.md exists in ai-backend/
- [ ] AI_SETUP.md exists in ai-backend/
- [ ] README_AI.md exists in root
- [ ] AI_IMPLEMENTATION_SUMMARY.md exists in root
- [ ] INDEX.md exists in ai-backend/

## 🐛 Error Handling

### Offline Scenarios
- [ ] Stop Ollama, check: UI shows "🔴 AI Offline"
- [ ] Stop backend, check: UI shows "🔴 AI Offline"
- [ ] Restart backend, check: UI shows "🟢 AI Ready"

### Recovery
- [ ] After error, AI reconnects when services restart
- [ ] No persistent errors after recovery
- [ ] Game continues to work normally

## 🆘 Troubleshooting Readiness

Can you answer "yes" to:
- [ ] Know how to check if Ollama is running?
- [ ] Know how to check if backend is running?
- [ ] Know how to open browser console (F12)?
- [ ] Know how to check network tab for API calls?
- [ ] Know where to find error messages?
- [ ] Know how to read documentation files?

## 🎮 Game Verification

- [ ] Can place pieces for both players
- [ ] Game initializes after setup
- [ ] Player turns alternate correctly
- [ ] Boss is in center of board
- [ ] All pieces render correctly
- [ ] AI moves appear on board
- [ ] Game log updates with AI moves
- [ ] No errors when AI plays

## 📈 Performance Baseline

Record these for future reference:
- [ ] First AI move time: _____ seconds
- [ ] Typical move time: _____ seconds
- [ ] Browser memory usage: _____ MB
- [ ] Model: _____ (mistral/llama2/etc)
- [ ] System: Windows / Mac / Linux

## 🚀 Advanced Features

- [ ] Try different models: `ollama pull llama2`
- [ ] Edit strategy prompts
- [ ] Change difficulty levels during game
- [ ] Use browser console to debug
- [ ] Modify AI behavior with environment

## ✅ Final Verification

Run through this final checklist:

- [ ] Ollama running
- [ ] Backend running on 3001
- [ ] game.html opens
- [ ] AI status shows "🟢 AI Ready"
- [ ] Can enable AI for players
- [ ] AI makes moves when enabled
- [ ] Moves complete within reasonable time
- [ ] No persistent errors
- [ ] Documentation accessible

## 🎉 Success!

If all items above are checked, your LLM AI opponent is fully set up and working!

### Next Steps
1. Play a full game against the AI
2. Try different difficulty levels
3. Experiment with different models
4. Customize strategy prompts
5. Share your experience!

---

## 📞 If Something Fails

**What to check**:
1. Terminal output (both Ollama and backend)
2. Browser console (F12)
3. Network tab (F12 → Network)
4. [QUICK_START.md](QUICK_START.md) - Common issues
5. [AI_SETUP.md](AI_SETUP.md) - Detailed troubleshooting

**Command to verify setup**:
```bash
# Check Ollama
curl http://localhost:11434

# Check Backend
curl http://localhost:3001/health

# Should return JSON responses without errors
```

**Browser console test**:
```javascript
// Should return true if connected
window.AIOpponent.enabled
```

---

**Document Version**: 1.0
**Last Updated**: 2025-12-18
**Status**: Ready for verification
