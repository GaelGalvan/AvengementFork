/**
 * aiOpponent.js - LLM AI opponent using Ollama backend
 * Evaluates board positions and recommends best moves
 */

(function() {
  const BACKEND_URL = 'http://localhost:3001';
  const MOVE_CACHE = new Map(); // Cache recent evaluations

  const AIOpponent = {
    enabled: false,
    difficulty: 'medium', // 'easy', 'medium', 'hard'
    thinking: false,
    lastMove: null,

    /**
     * Initialize AI opponent
     */
    init: function() {
      this.checkBackendConnection();
    },

    /**
     * Check if backend is running
     */
    checkBackendConnection: async function() {
      try {
        const response = await fetch(`${BACKEND_URL}/health`);
        if (response.ok) {
          const data = await response.json();
          console.log('✓ AI Backend connected:', data.model);
          this.enabled = true;
          this._updateStatusUI('connected');
          return true;
        }
      } catch (error) {
        console.warn('⚠ AI Backend not running. Start with: node ai-backend/ollamaServer.js');
        this._updateStatusUI('disconnected');
        return false;
      }
    },

    /**
     * Find best move for a piece
     * Returns: { move: [x, y], recommendation: move, reasoning: string }
     */
    findBestMove: async function(piece, validMoves, gameGrid) {
      if (!this.enabled || !piece || validMoves.length === 0) {
        return { move: validMoves[0], recommendation: 'Random (AI unavailable)' };
      }

      if (this.thinking) return null; // Prevent double-evaluation
      this.thinking = true;

      try {
        // Create simple board description
        const boardDescription = this._createBoardDescription(gameGrid, piece);
        // Use x=col (c), y=row (r) consistently
        const currentPos = [
          (typeof piece.c === 'number' ? piece.c : (typeof piece.x === 'number' ? piece.x : 0)),
          (typeof piece.r === 'number' ? piece.r : (typeof piece.y === 'number' ? piece.y : 0))
        ];

        // Get player and available AP
        const playerData = (window.__av2 && window.__av2.player) ? window.__av2.player[piece.player] : null;
        const availableAP = playerData ? playerData.ap : 3;

        // Get available abilities for this piece
        const abilities = this._getAvailableAbilities(piece, availableAP, gameGrid);

        // Check cache first
        const cacheKey = `${piece.player}_${piece.name}_${currentPos.join(',')}`;
        if (MOVE_CACHE.has(cacheKey)) {
          const cached = MOVE_CACHE.get(cacheKey);
          if (this._isMoveStillValid(cached.move, validMoves)) {
            console.log('Using cached move:', cached.move);
            this.thinking = false;
            return cached;
          }
        }

        const enemies = this._getEnemyPositions(gameGrid, piece.player);
        
        console.log(`[AI] Evaluating actions for ${piece.champion || piece.name} at ${currentPos.join(',')} with ${availableAP} AP`);
        console.log(`[AI] Abilities:`, abilities);
        console.log(`[AI] Enemies:`, enemies);
        console.log(`[AI] Valid moves:`, validMoves.slice(0, 3));
        
        this._updateStatusUI('thinking');

        const payload = {
          boardState: { grid: boardDescription },
          teamColor: piece.player === 'ally' ? 'A' : 'B',
          pieceType: piece.champion || piece.name,
          currentPos: currentPos,
          allValidMoves: validMoves,
          availableAP: availableAP,
          currentHealth: piece.currentHp || piece.hp || 7,
          maxHealth: piece.maxHp || piece.maxHealthPoints || 7,
          abilities: abilities,
          enemyPositions: enemies
        };
        
        const response = await fetch(`${BACKEND_URL}/api/best-move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          timeout: 60000  // 60 second timeout - let LLM take time
        }).catch(err => {
          console.error('[AI] Fetch failed:', err);
          throw err;
        });

        if (!response.ok) {
          throw new Error(`Backend error: ${response.status}`);
        }

        const result = await response.json();
        console.log('[AI] Full backend response:', JSON.stringify(result));

        if (result.success && (result.recommendation || result.action)) {
          const moveResult = {
            move: result.recommendation,
            action: result.action || 'move',
            target: result.target,
            ability: result.ability,
            reasoning: result.reasoning,
            allOptions: result.allValidMoves
          };
          
          console.log('[AI] Returning result:', JSON.stringify(moveResult));

          // Cache the result
          MOVE_CACHE.set(cacheKey, moveResult);

          // Limit cache size
          if (MOVE_CACHE.size > 50) {
            const firstKey = MOVE_CACHE.keys().next().value;
            MOVE_CACHE.delete(firstKey);
          }

          console.log(`[AI] Best move: (${result.recommendation[0]},${result.recommendation[1]})`);
          this._updateStatusUI('ready');
          return moveResult;
        } else {
          throw new Error('Invalid response from backend');
        }
      } catch (error) {
        console.error('[AI] Error finding best move:', error.message);
        this._updateStatusUI('error');
        const isTimeout = error.name === 'AbortError';
        return { 
          move: validMoves[0], 
          reasoning: isTimeout ? 'AI timed out - using first valid move' : 'Error - using fallback move',
          error: error.message 
        };
      } finally {
        this.thinking = false;
      }
    },

    /**
     * Get available abilities for current piece
     */
    _getAvailableAbilities: function(piece, ap, gameGrid) {
      const abilities = [];
      const champion = (piece.champion || piece.name || '').toLowerCase();

      if (champion === 'fighter') {
        if (ap >= 1) abilities.push({ name: 'Strike', cost: 1, damage: 2, range: 1, type: 'melee' });
        if (ap >= 3) abilities.push({ name: 'Lunging Strikes', cost: 3, damage: 2, range: 1, type: 'aoe' });
      } else if (champion === 'ranger') {
        if (ap >= 1) abilities.push({ name: 'Quick Shot', cost: 1, damage: 1, range: piece.focused ? 6 : 3, type: 'ranged' });
        if (ap >= 2 && !piece.cooldowns?.bullseye) abilities.push({ name: 'Bullseye', cost: 2, damage: 4, range: piece.focused ? 6 : 3, type: 'ranged' });
        if (ap >= 1) abilities.push({ name: 'Focused Stance', cost: 1, damage: 0, range: 0, type: 'buff' });
      } else if (champion === 'dragon') {
        abilities.push({ name: 'Firebreath', cost: 0, damage: 3, range: 1, type: 'aoe' });
        if (ap >= 2) abilities.push({ name: 'Focused Assault', cost: 2, damage: 2, range: 2, type: 'ranged-aoe' });
      }

      return abilities;
    },

    /**
     * Get enemy positions visible on the board
     */
    _getEnemyPositions: function(gameGrid, playerTeam) {
      if (!gameGrid || !Array.isArray(gameGrid)) return [];
      const piecesMap = (window.__av2 && window.__av2.pieces) ? window.__av2.pieces : {};
      const enemies = [];

      for (let r = 0; r < gameGrid.length; r++) {
        for (let c = 0; c < (gameGrid[r] ? gameGrid[r].length : 0); c++) {
          const id = gameGrid[r][c];
          if (!id) continue;
          const p = piecesMap[id];
          if (p && p.player !== playerTeam && p.player !== 'boss') {
            enemies.push({
              pos: [c, r],
              type: p.champion || p.name,
              hp: typeof p.currentHp === 'number' ? p.currentHp : (typeof p.hp === 'number' ? p.hp : 'N/A')
            });
          }
        }
      }

      return enemies;
    },

    /**
     * Create simple board description from game grid
     */
    _createBoardDescription: function(gameGrid, currentPiece) {
      if (!gameGrid || !Array.isArray(gameGrid)) return 'Empty board';

      const piecesMap = (window.__av2 && window.__av2.pieces) ? window.__av2.pieces : {};
      const description = [];

      for (let r = 0; r < gameGrid.length; r++) {
        for (let c = 0; c < (gameGrid[r] ? gameGrid[r].length : 0); c++) {
          const id = gameGrid[r][c];
          if (!id) continue;
          const p = piecesMap[id] || null;
          const team = p && p.player ? (p.player === 'ally' ? 'ALLY' : (p.player === 'enemy' ? 'ENEMY' : 'BOSS'))
                                     : (id[0] === 'A' ? 'ALLY' : (id[0] === 'E' ? 'ENEMY' : 'BOSS'));
          const type = (p && (p.champion || p.name)) ? (p.champion || p.name) : 'piece';
          const hp = p ? (typeof p.currentHp === 'number' ? p.currentHp : (typeof p.hp === 'number' ? p.hp : 'N/A')) : 'N/A';
          description.push(`${team} ${type} HP:${hp} (${c},${r})`);
        }
      }

      return description.join(' | ') || 'Empty board';
    },

    /**
     * Evaluate all pieces in current position (for AI turn)
     */
    evaluateAllMoves: async function(team) {
      if (!this.enabled) return null;

      try {
        const gm = window.GameManager;
        if (!gm || !gm.players) return null;

        const playerNum = team === 'A' ? 1 : 2;
        const player = gm.players[playerNum];
        if (!player || !player.pieces) return null;

        const positions = [];
        for (const piece of player.pieces) {
          const validMoves = piece.validMoves ? piece.validMoves(window.BoardState) : [];
          if (validMoves.length > 0) {
            positions.push({
              piece: piece,
              boardState: window.BoardStateAnalyzer.getBoardState(),
              teamColor: piece.team,
              pieceType: piece.constructor.name,
              currentPos: [piece.x, piece.y],
              moves: validMoves
            });
          }
        }

        if (positions.length === 0) return null;

        // Evaluate positions in batch
        const response = await fetch(`${BACKEND_URL}/api/evaluate-positions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ positions })
        });

        if (!response.ok) throw new Error('Batch evaluation failed');

        const result = await response.json();
        return result.evaluations;
      } catch (error) {
        console.error('[AI] Batch evaluation error:', error.message);
        return null;
      }
    },

    /**
     * Apply difficulty modifier to AI decisions
     */
    applyDifficulty: function(evaluations, difficulty) {
      if (!evaluations) return [];

      // Easy: AI makes suboptimal moves 40% of the time
      // Medium: AI makes suboptimal moves 20% of the time
      // Hard: AI always picks best move

      const shouldSuboptimal = {
        'easy': Math.random() < 0.4,
        'medium': Math.random() < 0.2,
        'hard': false
      }[difficulty || 'medium'];

      if (shouldSuboptimal && evaluations.length > 1) {
        // Pick second or third best move randomly
        return evaluations.slice(1, Math.min(3, evaluations.length));
      }

      return evaluations;
    },

    /**
     * Check if recommended move is still valid
     */
    _isMoveStillValid: function(move, validMoves) {
      return validMoves.some(([x, y]) => x === move[0] && y === move[1]);
    },

    /**
     * Update UI status display
     */
    _updateStatusUI: function(status) {
      const elem = document.getElementById('aiStatus');
      if (!elem) return;

      const statusMap = {
        'connected': '🟢 AI Ready',
        'disconnected': '🔴 AI Offline',
        'thinking': '🟡 AI Thinking...',
        'ready': '🟢 AI Ready',
        'error': '🔴 AI Error'
      };

      elem.textContent = statusMap[status] || status;
      elem.className = `ai-status ${status}`;
    },

    /**
     * Clear cache (useful for testing)
     */
    clearCache: function() {
      MOVE_CACHE.clear();
      console.log('[AI] Cache cleared');
    }
  };

  window.AIOpponent = AIOpponent;

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AIOpponent.init());
  } else {
    AIOpponent.init();
  }
})();
