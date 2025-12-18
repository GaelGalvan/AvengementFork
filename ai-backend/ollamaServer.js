/**
 * ollamaServer.js - Node.js backend for Ollama LLM AI opponent
 * Connects to local Ollama instance and evaluates board positions
 * Run: node ollamaServer.js
 * API runs on http://localhost:3001
 */

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;
const OLLAMA_URL = 'http://localhost:11434';
const MODEL = 'mistral'; // Change to your preferred model (llama2, neural-chat, etc.)

app.use(cors());
app.use(express.json());

// Game rules and mechanics
const GAME_RULES = `AVENGEMENT STRATEGIC GUIDE:

OBJECTIVE: Win by eliminating enemies while staying alive

STRATEGIC PRIORITIES (in order):
1. KILL SHOT: If ability eliminates enemy (enemy.HP <= ability.dmg) → ATTACK
2. DEFEND: If low health (HP < 3) and enemy close → MOVE AWAY or DEFEND
3. SETUP: If far from enemies (distance > 3) → MOVE CLOSER to position
4. EFFICIENT ATTACK: If high damage attack available AND won't take dangerous damage → ATTACK
5. REPOSITION: Otherwise MOVE toward nearest enemy

AP MANAGEMENT:
- Don't waste AP on weak attacks (1dmg) if you have high health
- Save AP for powerful attacks (2+ dmg) in future turns
- Example: Don't use Quick Shot (1AP, 1dmg) if you could use Strike (1AP, 2dmg)

HEALTH STATES:
- Healthy (HP > 5): Be aggressive, look for good attacks
- Medium (HP 3-5): Balance offense and defense
- Low (HP < 3): Prioritize survival, move away from danger

DISTANCE:
- max(|dx|,|dy|) = Chebyshev distance
- Close = distance 1-2 (danger zone)
- Medium = distance 3-4 (combat ready)
- Far = distance 5+ (setup phase)`;

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', model: MODEL });
});

/**
 * Main endpoint: Analyze board state and find best move
 * POST /api/best-move
 * Body: { boardState, teamColor, allValidMoves }
 */
app.post('/api/best-move', async (req, res) => {
  try {
    const { boardState, teamColor, allValidMoves, pieceType, currentPos, availableAP, abilities, enemyPositions, currentHealth, maxHealth } = req.body;

    if (!boardState || !teamColor) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Format the board state for the LLM
    const boardDescription = formatBoardState(boardState);
    const movesDescription = formatMoves(allValidMoves, currentPos);
    const abilitiesDescription = formatAbilities(abilities, availableAP);
    const enemiesDescription = formatEnemies(enemyPositions);

    // Create the prompt with health awareness
    const prompt = buildPrompt(
      boardDescription,
      teamColor,
      movesDescription,
      pieceType,
      currentPos,
      abilitiesDescription,
      enemiesDescription,
      availableAP,
      currentHealth,
      maxHealth,
      enemyPositions
    );

    console.log(`[${new Date().toISOString()}] Analyzing position for team ${teamColor}`);
    console.log('Prompt:', prompt.substring(0, 200) + '...');

    // Call Ollama - let it take as long as needed
    let response;
    let result;
    try {
      console.log('Calling LLM...');
      response = await callOllama(prompt);
      console.log('LLM Response:', response.substring(0, 150));
      result = parseActionResponse(response, allValidMoves, abilities, enemyPositions);
      console.log('Parsed result:', JSON.stringify(result));
    } catch (error) {
      console.warn('LLM failed, using rule-based fallback:', error.message);
      result = getRuleBasedAction(currentPos, enemyPositions, abilities, allValidMoves, availableAP, currentHealth, maxHealth);
      console.log('Rule-based result:', JSON.stringify(result));
    }

    res.json({
      success: true,
      action: result.action,
      recommendation: result.target,
      target: result.target,
      ability: result.ability,
      reasoning: result.reasoning || 'Strategic action',
      allValidMoves
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Batch move evaluation endpoint
 * POST /api/evaluate-positions
 * Body: { positions: [{ boardState, moves, ... }] }
 */
app.post('/api/evaluate-positions', async (req, res) => {
  try {
    const { positions } = req.body;

    if (!positions || !Array.isArray(positions)) {
      return res.status(400).json({ error: 'Expected positions array' });
    }

    const evaluations = [];

    for (const pos of positions) {
      const boardDescription = formatBoardState(pos.boardState);
      const movesDescription = formatMoves(pos.moves, pos.currentPos);
      const prompt = buildPrompt(
        boardDescription,
        pos.teamColor,
        movesDescription,
        pos.pieceType,
        pos.currentPos
      );

      const response = await callOllama(prompt);
      const bestMove = parseMoveResponse(response, pos.moves);

      evaluations.push({
        currentPos: pos.currentPos,
        recommendation: bestMove,
        score: calculateMoveScore(response)
      });
    }

    res.json({ success: true, evaluations });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Format board state as readable text for LLM
 */
function formatBoardState(boardState) {
  if (!boardState) {
    return 'Empty board (7x7)';
  }

  // Handle simple grid string format
  if (typeof boardState.grid === 'string') {
    return boardState.grid;
  }

  // Handle array format
  if (Array.isArray(boardState.grid)) {
    return boardState.grid.join(', ');
  }

  return 'Board state available';
}

/**
 * Format valid moves as readable text
 */
function formatMoves(moves, currentPos) {
  if (!moves || moves.length === 0) return 'No moves';
  return moves.map(([x, y]) => `(${x},${y})`).slice(0, 5).join(', ');
}

/**
 * Format abilities for LLM
 */
function formatAbilities(abilities, ap) {
  if (!abilities || abilities.length === 0) return 'None';
  return abilities.map(a => `${a.name}(${a.cost}AP,${a.damage}dmg,range${a.range})`).join(', ');
}

/**
 * Format enemy positions for LLM
 */
function formatEnemies(enemies) {
  if (!enemies || enemies.length === 0) return 'None in range';
  return enemies.map(e => `${e.type}(${e.hp}HP)@(${e.pos[0]},${e.pos[1]})`).join(', ');
}

/**
 * Build the LLM prompt for strategic move analysis
 */
function buildPrompt(boardDescription, teamColor, movesDescription, pieceType, currentPos, abilitiesDescription, enemiesDescription, availableAP, currentHealth, maxHealth, enemyPositions) {
  const team = teamColor === 'A' ? 'ALLY' : 'ENEMY';
  const [x, y] = currentPos;
  const healthPercent = Math.round((currentHealth / maxHealth) * 100);
  
  // Calculate distances and threat levels
  let enemyInfo = enemiesDescription;
  let threatLevel = 'None';
  if (enemiesDescription && enemiesDescription !== 'None in range' && enemyPositions && enemyPositions.length > 0) {
    const lines = enemiesDescription.split(', ');
    const threats = [];
    for (let i = 0; i < lines.length && i < enemyPositions.length; i++) {
      const line = lines[i];
      const enemy = enemyPositions[i];
      const match = line.match(/\((\d+),(\d+)\)/);
      if (match) {
        const ex = parseInt(match[1]);
        const ey = parseInt(match[2]);
        const chebDist = Math.max(Math.abs(ex - x), Math.abs(ey - y));
        threats.push({ dist: chebDist, type: enemy.type });
      }
    }
    if (threats.length > 0) {
      enemyInfo = lines.map((line, idx) => {
        if (threats[idx]) {
          return `${line} distance=${threats[idx].dist}`;
        }
        return line;
      }).join(', ');
      const closest = threats.reduce((a, b) => a.dist < b.dist ? a : b);
      if (closest.dist <= 1) threatLevel = 'CRITICAL';
      else if (closest.dist <= 2) threatLevel = 'HIGH';
      else if (closest.dist <= 3) threatLevel = 'MEDIUM';
      else threatLevel = 'LOW';
    }
  }

  return `${GAME_RULES}

CURRENT STATE:
- Position: (${x},${y})
- Health: ${currentHealth}/${maxHealth} HP (${healthPercent}%) [THREAT: ${threatLevel}]
- Available AP: ${availableAP}

NEARBY ENEMIES: ${enemyInfo}
YOUR ABILITIES: ${abilitiesDescription}
VALID MOVES: ${movesDescription}

DECISION FRAMEWORK:
1. Is this a KILL SHOT? (enemy HP <= ability dmg) → ATTACK
2. Are you CRITICAL? (HP < 3) AND close to enemy → MOVE AWAY
3. Are you FAR (distance > 3)? → MOVE CLOSER for setup
4. Can you do 2+ damage? AND you're healthy? → ATTACK
5. Otherwise → MOVE toward nearest enemy

REPLY IN THIS EXACT FORMAT:
ACTION: attack or move
TARGET: (x,y)
ABILITY: ability_name or none
REASONING: reason in 3 words max`;
}


/**
 * Call Ollama API with prompt
 */
async function callOllama(prompt) {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt: prompt,
        stream: false,
        temperature: 0.1,
        top_p: 0.5,
        num_predict: 30,
        num_ctx: 512
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || '';
  } catch (error) {
    console.error('Ollama call failed:', error.message);
    throw new Error(`Failed to call Ollama: ${error.message}`);
  }
}

/**
 * Parse LLM response for action (attack/move) recommendation
 */
function parseActionResponse(response, validMoves, abilities, enemies) {
  const result = { action: 'move', target: null, ability: null, reasoning: '' };

  console.log('Raw LLM response:', response.substring(0, 500));

  // Try to extract ACTION: attack/move
  const actionMatch = response.match(/ACTION\s*:\s*(attack|move)/i);
  if (actionMatch) {
    result.action = actionMatch[1].toLowerCase();
    console.log('Found action in response:', result.action);
  }

  // Try to extract TARGET: (x,y)
  const targetMatch = response.match(/TARGET\s*:\s*\(?\s*(\d+)\s*,\s*(\d+)\s*\)?/i);
  if (targetMatch) {
    result.target = [parseInt(targetMatch[1]), parseInt(targetMatch[2])];
    console.log('Found target:', result.target);
  }

  // Try to extract ABILITY: name
  const abilityMatch = response.match(/ABILITY\s*:\s*([\w\s]+?)(?:\n|$)/i);
  if (abilityMatch) {
    result.ability = abilityMatch[1].trim();
    if (result.ability.toLowerCase() === 'none') {
      result.ability = null;
    }
    console.log('Found ability:', result.ability);
  }

  // Try to extract REASONING
  const reasoningMatch = response.match(/REASONING\s*:\s*(.+?)(?:\n|$)/i);
  if (reasoningMatch) {
    result.reasoning = reasoningMatch[1].trim().substring(0, 150);
  }

  // Validate target is in valid moves
  if (result.target) {
    const isValid = validMoves.some(([mx, my]) => mx === result.target[0] && my === result.target[1]);
    if (!isValid) {
      console.log('Target not in valid moves, searching valid list...');
      result.target = validMoves[0] || null;
    }
  } else if (validMoves.length > 0) {
    result.target = validMoves[0];
    console.log('No target found, using first valid move:', result.target);
  }

  return result;
}

/**
 * Parse LLM response for move (legacy - DEPRECATED)
 */
function parseMoveResponse(response, validMoves) {
  // Try multiple patterns for robustness
  const patterns = [
    /BEST_MOVE:\s*\((\d+),\s*(\d+)\)/i,
    /move.*?\((\d+),\s*(\d+)\)/i,
    /\((\d+),\s*(\d+)\)/
  ];

  for (const pattern of patterns) {
    const match = response.match(pattern);
    if (match) {
      const x = parseInt(match[1]);
      const y = parseInt(match[2]);
      
      // Verify move is valid
      if (validMoves.some(([mx, my]) => mx === x && my === y)) {
        console.log(`Parsed move (${x},${y}) from response`);
        return [x, y];
      }
    }
  }

  // Fallback: pick a strategic move (prefer center-ish)
  console.log('Using fallback move selection');
  if (validMoves.length > 0) {
    const centerMove = validMoves.reduce((best, move) => {
      const [x, y] = move;
      const distToCenter = Math.abs(x - 3) + Math.abs(y - 3);
      const [bx, by] = best;
      const bestDist = Math.abs(bx - 3) + Math.abs(by - 3);
      return distToCenter < bestDist ? move : best;
    });
    return centerMove;
  }
  return [0, 0];
}

/**
 * Rule-based action selection (fast fallback)
 */
function getRuleBasedAction(currentPos, enemies, abilities, validMoves, availableAP, currentHealth, maxHealth) {
  console.log('Using rule-based AI fallback');
  console.log('Current pos:', currentPos, 'Health:', currentHealth, '/', maxHealth, 'Available AP:', availableAP);
  
  const [cx, cy] = currentPos;
  const healthPercent = currentHealth / maxHealth;
  const isCritical = currentHealth < 3;
  const isHealthy = currentHealth > 5;
  
  // PRIORITY 1: Kill shots (always do these)
  if (enemies && enemies.length > 0) {
    const abilitiesWithDamage = (abilities || []).map(a => ({
      ...a,
      damage: typeof a.damage === 'number' ? a.damage : parseInt(a.damage) || 1,
      cost: typeof a.cost === 'number' ? a.cost : parseInt(a.cost) || 1
    })).sort((a, b) => b.damage - a.damage);

    for (const ability of abilitiesWithDamage) {
      if (availableAP < ability.cost) continue;
      
      for (const enemy of enemies) {
        const [ex, ey] = enemy.pos;
        const dist = Math.max(Math.abs(ex - cx), Math.abs(ey - cy));
        
        if (dist <= ability.range && enemy.hp !== 'N/A' && typeof enemy.hp === 'number' && enemy.hp <= ability.damage) {
          // Kill shot!
          return {
            action: 'attack',
            target: [ex, ey],
            ability: ability.name,
            reasoning: `KILL SHOT: ${ability.name} eliminates ${enemy.type}`
          };
        }
      }
    }
  }
  
  // PRIORITY 2: Defend if in critical health
  if (isCritical && enemies && enemies.length > 0) {
    // Try to move away from nearest enemy
    const [nx, ny] = enemies[0].pos;
    const bestMove = validMoves.reduce((best, move) => {
      const distToEnemy = Math.max(Math.abs(move[0] - nx), Math.abs(move[1] - ny));
      return distToEnemy > best.dist ? { move, dist: distToEnemy } : best;
    }, { dist: -Infinity });
    
    return {
      action: 'move',
      target: bestMove.move,
      ability: null,
      reasoning: `DEFEND: Low HP, retreat`
    };
  }
  
  // PRIORITY 3: Position up if far from enemies
  if (enemies && enemies.length > 0 && validMoves && validMoves.length > 0) {
    const nearest = enemies.reduce((closest, e) => {
      const dist = Math.max(Math.abs(e.pos[0] - cx), Math.abs(e.pos[1] - cy));
      return dist < closest.dist ? { enemy: e, dist } : closest;
    }, { dist: Infinity });
    
    // If far away, move toward enemy for positioning
    if (nearest.dist > 3) {
      const bestMove = validMoves.reduce((best, move) => {
        const dist = Math.max(Math.abs(move[0] - nearest.enemy.pos[0]), Math.abs(move[1] - nearest.enemy.pos[1]));
        return dist < best.dist ? { move, dist } : best;
      }, { dist: Infinity });
      
      return {
        action: 'move',
        target: bestMove.move,
        ability: null,
        reasoning: `Setup: Move closer to ${nearest.enemy.type}`
      };
    }
  }
  
  // PRIORITY 4: Good damage attacks (only if healthy and worth it)
  if (isHealthy && enemies && enemies.length > 0) {
    const strongAbilities = (abilities || [])
      .map(a => ({
        ...a,
        damage: typeof a.damage === 'number' ? a.damage : parseInt(a.damage) || 1,
        cost: typeof a.cost === 'number' ? a.cost : parseInt(a.cost) || 1
      }))
      .filter(a => a.damage >= 2) // Only strong attacks
      .sort((a, b) => b.damage - a.damage);
    
    for (const ability of strongAbilities) {
      if (availableAP < ability.cost) continue;
      
      for (const enemy of enemies) {
        const [ex, ey] = enemy.pos;
        const dist = Math.max(Math.abs(ex - cx), Math.abs(ey - cy));
        
        if (dist <= ability.range) {
          return {
            action: 'attack',
            target: [ex, ey],
            ability: ability.name,
            reasoning: `Strong attack: ${ability.name} (${ability.damage}dmg)`
          };
        }
      }
    }
  }
  
  // PRIORITY 5: Move toward nearest enemy (general case)
  if (enemies && enemies.length > 0 && validMoves && validMoves.length > 0) {
    const nearest = enemies.reduce((closest, e) => {
      const dist = Math.max(Math.abs(e.pos[0] - cx), Math.abs(e.pos[1] - cy));
      return dist < closest.dist ? { enemy: e, dist } : closest;
    }, { dist: Infinity });
    
    const bestMove = validMoves.reduce((best, move) => {
      const dist = Math.max(Math.abs(move[0] - nearest.enemy.pos[0]), Math.abs(move[1] - nearest.enemy.pos[1]));
      return dist < best.dist ? { move, dist } : best;
    }, { dist: Infinity });
    
    return {
      action: 'move',
      target: bestMove.move,
      ability: null,
      reasoning: `Advance toward ${nearest.enemy.type}`
    };
  }
  
  // Fallback: first valid move
  return {
    action: 'move',
    target: validMoves[0] || [0, 0],
    ability: null,
    reasoning: 'Move to position'
  };
}

/**
 * Calculate a confidence score from LLM response
 */
function calculateMoveScore(response) {
  const keywords = ['attack', 'strong', 'optimal', 'best', 'advantage'];
  let score = 0.5; // base score

  keywords.forEach(keyword => {
    if (response.toLowerCase().includes(keyword)) score += 0.1;
  });

  return Math.min(score, 1.0);
}

/**
 * Start server
 */
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════╗
║  Avengement LLM AI Backend (Ollama)    ║
║  Running on http://localhost:${PORT}     ║
║  Model: ${MODEL.padEnd(28, ' ')}║
║  Ollama: ${OLLAMA_URL.padEnd(23, ' ')}║
╚════════════════════════════════════════╝
  `);
  console.log('Waiting for requests...');
});

server.on('error', (err) => {
  console.error('Server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please stop the other service or change PORT.`);
  }
  process.exit(1);
});
