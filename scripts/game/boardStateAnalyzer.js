/**
 * boardStateAnalyzer.js - Analyzes board state for AI decision making
 * Exports board state in a format the LLM can understand
 */

(function() {
  const Analyzer = {
    /**
     * Get full board state representation
     */
    getBoardState: function() {
      const boardState = window.BoardState;
      return {
        size: boardState.size,
        grid: this._serializeGrid(boardState.grid),
        pieces: this._getPiecesList(),
        threats: this._analyzeTreats(),
        opportunities: this._analyzeOpportunities()
      };
    },

    /**
     * Serialize grid for JSON transmission
     */
    _serializeGrid: function(grid) {
      const serialized = [];
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          const piece = grid[y][x];
          if (piece) {
            serialized.push({
              x: x,
              y: y,
              type: piece.constructor.name,
              team: piece.team,
              hp: piece.currentHp,
              maxHp: piece.maxHp,
              name: piece.name
            });
          }
        }
      }
      return serialized;
    },

    /**
     * Get list of all pieces with positions
     */
    _getPiecesList: function() {
      const pieces = [];
      const gm = window.GameManager;

      if (gm && gm.players) {
        ['1', '2'].forEach(playerKey => {
          const player = gm.players[playerKey];
          if (player && player.pieces) {
            player.pieces.forEach(piece => {
              pieces.push({
                id: piece.name,
                team: piece.team,
                type: piece.constructor.name,
                pos: [piece.x, piece.y],
                hp: piece.currentHp,
                maxHp: piece.maxHp
              });
            });
          }
        });
      }

      if (gm && gm.boss) {
        const boss = gm.boss;
        pieces.push({
          id: 'Boss',
          team: boss.team,
          type: 'BossDragon',
          pos: [boss.x, boss.y],
          hp: boss.currentHp,
          maxHp: boss.maxHp
        });
      }

      return pieces;
    },

    /**
     * Analyze threats on the board
     */
    _analyzeTreats: function() {
      const threats = [];
      const boardState = window.BoardState;
      const gm = window.GameManager;

      if (!gm || !gm.players) return threats;

      // Check each player's pieces for proximity to enemies
      ['1', '2'].forEach(playerKey => {
        const player = gm.players[playerKey];
        if (player && player.pieces) {
          player.pieces.forEach(piece => {
            const nearby = this._getNearbyEnemies(piece, boardState);
            nearby.forEach(enemy => {
              threats.push({
                piece: piece.name,
                team: piece.team,
                threat: enemy.name,
                distance: this._distance(piece, enemy)
              });
            });
          });
        }
      });

      return threats;
    },

    /**
     * Analyze opportunities (enemies within attack range, etc)
     */
    _analyzeOpportunities: function() {
      const opportunities = [];
      const boardState = window.BoardState;
      const gm = window.GameManager;

      if (!gm || !gm.players) return opportunities;

      ['1', '2'].forEach(playerKey => {
        const player = gm.players[playerKey];
        if (player && player.pieces) {
          player.pieces.forEach(piece => {
            const nearby = this._getNearbyEnemies(piece, boardState);
            nearby.forEach(enemy => {
              if (this._distance(piece, enemy) <= 2) {
                opportunities.push({
                  piece: piece.name,
                  target: enemy.name,
                  distance: this._distance(piece, enemy),
                  canAttack: this._canAttack(piece, enemy)
                });
              }
            });
          });
        }
      });

      return opportunities;
    },

    /**
     * Get nearby enemies for a piece
     */
    _getNearbyEnemies: function(piece, boardState) {
      const enemies = [];
      const range = 4;

      for (let y = Math.max(0, piece.y - range); y <= Math.min(6, piece.y + range); y++) {
        for (let x = Math.max(0, piece.x - range); x <= Math.min(6, piece.x + range); x++) {
          const target = boardState.getPiece(x, y);
          if (target && target.team !== piece.team) {
            enemies.push(target);
          }
        }
      }

      return enemies;
    },

    /**
     * Calculate distance between two pieces
     */
    _distance: function(piece1, piece2) {
      const dx = piece1.x - piece2.x;
      const dy = piece1.y - piece2.y;
      return Math.max(Math.abs(dx), Math.abs(dy)); // Chebyshev distance
    },

    /**
     * Check if piece can attack another
     */
    _canAttack: function(piece, target) {
      const dist = this._distance(piece, target);
      // Most pieces can attack within range 1-2
      return dist <= 2 && dist > 0;
    },

    /**
     * Evaluate a specific move's quality
     */
    evaluateMove: function(piece, toX, toY, boardState) {
      const evaluation = {
        move: `(${piece.x},${piece.y}) -> (${toX},${toY})`,
        score: 0.5,
        factors: []
      };

      // Check if move is safe (not moving into danger)
      const danger = this._checkDanger(toX, toY, piece.team, boardState);
      if (!danger) {
        evaluation.score += 0.2;
        evaluation.factors.push('Safe position');
      } else {
        evaluation.factors.push('Dangerous territory');
      }

      // Check if move gets closer to enemy
      const targetPos = this._getClosestEnemyPos(piece.team, boardState);
      if (targetPos) {
        const oldDist = this._distance(piece, { x: targetPos[0], y: targetPos[1] });
        const newDist = Math.max(Math.abs(toX - targetPos[0]), Math.abs(toY - targetPos[1]));
        if (newDist < oldDist) {
          evaluation.score += 0.3;
          evaluation.factors.push('Moves toward enemy');
        }
      }

      // Check if move is away from boss
      const bossDist = Math.max(Math.abs(toX - 3), Math.abs(toY - 3));
      if (bossDist > 1) {
        evaluation.score += 0.1;
        evaluation.factors.push('Away from boss');
      }

      return evaluation;
    },

    /**
     * Check if position is under threat
     */
    _checkDanger: function(x, y, team, boardState) {
      const nearby = [];
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const piece = boardState.getPiece(x + dx, y + dy);
          if (piece && piece.team !== team) {
            nearby.push(piece);
          }
        }
      }
      return nearby.length > 0;
    },

    /**
     * Get closest enemy position
     */
    _getClosestEnemyPos: function(team, boardState) {
      const gm = window.GameManager;
      if (!gm) return null;

      let closest = null;
      let minDist = Infinity;

      ['1', '2'].forEach(playerKey => {
        const player = gm.players[playerKey];
        if (player && player.pieces) {
          player.pieces.forEach(piece => {
            if (piece.team !== team) {
              const dist = piece.x * piece.x + piece.y * piece.y; // approximation
              if (dist < minDist) {
                minDist = dist;
                closest = [piece.x, piece.y];
              }
            }
          });
        }
      });

      return closest;
    }
  };

  window.BoardStateAnalyzer = Analyzer;
})();
