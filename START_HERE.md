# 🚀 Avengement LLM AI - Start Here!

## Welcome! 👋

You have just received a **complete LLM AI opponent system** for Avengement.

This is your **Start Here** guide. Choose what to do next:

---

## ⏱️ I Have 5 Minutes

**Goal**: Get the AI running NOW

**Do this**:
1. Open `ai-backend/QUICK_START.md`
2. Follow the 3 installation steps
3. Run the commands
4. Open game.html
5. Check "🟢 AI Ready" appears
6. Enable "Player 2 (AI)" 
7. Play!

**Time**: ~5 minutes

---

## ⏱️ I Have 15 Minutes

**Goal**: Understand the basics + get running

**Do this**:
1. Read `README_AI.md` (this file)
2. Open `ai-backend/QUICK_START.md`
3. Follow setup steps
4. Try the AI in a game
5. Experiment with difficulty levels

**Time**: ~15 minutes

---

## ⏱️ I Have 30 Minutes

**Goal**: Full understanding of the system

**Do this**:
1. Read `README_AI.md` (overview)
2. Read `ai-backend/AI_SETUP.md` (detailed setup)
3. Run setup commands
4. Play a full game
5. Check browser console (F12) for debug info
6. Try customizing difficulty or model

**Time**: ~30 minutes

---

## ⏱️ I Want to Customize

**Goal**: Modify AI strategy and behavior

**Do this**:
1. Complete full setup
2. Read: `ai-backend/AI_SETUP.md` → Customization section
3. Edit: Strategy prompts in `ai-backend/ollamaServer.js`
4. Test: Run backend, play game
5. Iterate: Adjust prompts based on results

**Resources**:
- `buildPrompt()` function in ollamaServer.js
- Strategy goals section
- Temperature and top_p parameters

---

## 📋 Quick Navigation

### 📖 Documentation
| File | Purpose | Time |
|------|---------|------|
| **README_AI.md** | Overview & basics | 10 min |
| **QUICK_START.md** | Setup commands | 5 min |
| **AI_SETUP.md** | Detailed guide | 20 min |
| **AI_IMPLEMENTATION_SUMMARY.md** | Technical details | 30 min |
| **INDEX.md** | Documentation map | 5 min |

### 🛠️ Tools
| File | Purpose |
|------|---------|
| **start-backend.bat** | Windows launcher |
| **start-backend.ps1** | PowerShell launcher |
| **model_manager.py** | Download/test models |

### ✅ Checklists
| File | Purpose |
|------|---------|
| **VERIFICATION_CHECKLIST.md** | Verify setup complete |
| **IMPLEMENTATION_COMPLETE.md** | What was delivered |

---

## 🎮 The 3-Step Setup

```bash
# STEP 1: Get Ollama (5 min)
ollama pull mistral
ollama serve  # Keep running

# STEP 2: Install backend (2 min)
cd ai-backend
npm install

# STEP 3: Start backend (1 min)
npm start
# Server runs on http://localhost:3001

# STEP 4: Open game.html
# Look for: 🟢 AI Ready in sidebar
```

**Total time**: ~10 minutes

---

## 💡 First Time? Do This:

1. **Read** this file (you're reading it!)
2. **Choose your time bracket** above
3. **Follow the path** for that bracket
4. **Run the setup commands** 
5. **Play the game**
6. **Experiment**

---

## 🤔 Common Questions

**Q: Do I need to pay?**
A: No, everything is free and open-source.

**Q: Do I need internet?**
A: No, Ollama runs locally. No cloud required.

**Q: How long does setup take?**
A: ~5 minutes if you're familiar with terminals, ~10 if you're new.

**Q: Does it work on Windows/Mac/Linux?**
A: Yes, all platforms supported.

**Q: Can I customize the AI?**
A: Yes, fully customizable. See AI_SETUP.md → Customization.

**Q: What LLM models can I use?**
A: mistral (default), llama2, neural-chat, and many others.

**Q: Why doesn't it work?**
A: See VERIFICATION_CHECKLIST.md or AI_SETUP.md → Troubleshooting.

---

## 📁 What You Have

```
Backend System:
├── ollamaServer.js (Express server)
├── package.json (Dependencies)
├── start-backend.bat (Windows launcher)
├── start-backend.ps1 (PowerShell launcher)
└── node_modules/ (Created after npm install)

Frontend Integration:
├── boardStateAnalyzer.js (Board analysis)
├── aiOpponent.js (AI manager)
├── gameManager.js (Game logic + AI)
└── game.html (UI + controls)

Documentation:
├── README_AI.md (This overview)
├── QUICK_START.md (Setup guide)
├── AI_SETUP.md (Detailed guide)
├── AI_IMPLEMENTATION_SUMMARY.md (Technical)
├── INDEX.md (Documentation map)
├── VERIFICATION_CHECKLIST.md (Testing)
└── IMPLEMENTATION_COMPLETE.md (What was made)

Tools:
├── model_manager.py (Model manager)
└── start-backend.* (Startup scripts)
```

---

## ✨ Key Features

- ✅ **Easy setup** - 3 commands, ~5 minutes
- ✅ **UI integration** - Simple checkboxes to enable AI
- ✅ **Customizable** - Change models, prompts, parameters
- ✅ **Well documented** - 5 comprehensive guides
- ✅ **Cross-platform** - Windows, Mac, Linux
- ✅ **Local LLM** - No cloud, no API keys
- ✅ **Difficulty levels** - Easy, Medium, Hard
- ✅ **Real-time** - 1-2 second move evaluation
- ✅ **Error handling** - Graceful failures with fallbacks
- ✅ **Extensible** - Easy to modify and enhance

---

## 🚦 Status Indicators

When you open the game:

- 🟢 **Green** = AI ready to play
- 🟡 **Yellow** = AI is thinking
- 🔴 **Red** = AI backend offline

If red: Make sure both Ollama and backend are running.

---

## 🎯 Next Step

**Pick one:**

### Option A: I want to play NOW (5 min)
→ Open `ai-backend/QUICK_START.md` and follow the commands

### Option B: I want to understand first (15 min)
→ Read `README_AI.md` then follow Option A

### Option C: I want complete details (30 min)
→ Read `ai-backend/AI_SETUP.md` then follow Option A

### Option D: I want to customize it (1 hour)
→ Complete Option A, then read customization section in `ai-backend/AI_SETUP.md`

---

## 🎉 Ready?

**Go to**: `ai-backend/QUICK_START.md`

That file has everything you need to get started in 5 minutes.

---

## 📞 Help Resources

**Can't find something?**
- Check: `ai-backend/INDEX.md` (Documentation map)

**Setup not working?**
- Check: `ai-backend/AI_SETUP.md` (Troubleshooting)

**Want to verify it's working?**
- Check: `ai-backend/VERIFICATION_CHECKLIST.md`

**Want technical details?**
- Check: `AI_IMPLEMENTATION_SUMMARY.md`

**Everything seems broken?**
- Check: Browser console (F12)
- Check: Terminal output (backend)
- Check: Ollama is running (`ollama serve`)

---

## 🎓 Learning Path

```
START HERE (You are here!)
        ↓
    README_AI.md
        ↓
    QUICK_START.md (Setup)
        ↓
    Play game!
        ↓
    Try different models
        ↓
    Read AI_SETUP.md (Advanced)
        ↓
    Customize prompts
        ↓
    Master the system!
```

---

## 💪 You're Ready!

Everything is installed and ready to go.

**The only thing standing between you and an LLM-powered AI opponent is:**

1. Reading QUICK_START.md (5 min)
2. Running 3 commands (5 min)
3. Opening game.html (instant)

**That's it!**

---

## 🚀 Last Step: Start Now

**Go to** → `ai-backend/QUICK_START.md`

Everything else you need is documented there.

---

**Questions?** See `ai-backend/INDEX.md` for documentation map

**Something broken?** See troubleshooting in `ai-backend/AI_SETUP.md`

**Ready to play?** See setup in `ai-backend/QUICK_START.md`

---

Happy Gaming! 🤖♟️
