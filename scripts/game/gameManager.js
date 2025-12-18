// gameManager.js — basic turn manager and demo setup with LLM AI
(function(){
const GM = {
currentPlayer: 1,
players: {
1: {ap:3, hp:0, pieces:[], isAI: false},
2: {ap:3, hp:0, pieces:[], isAI: false}
},
boss: null,
aiDifficulty: 'medium',
init: function(){
this.reset();
},
reset: function(){
window.BoardState.clear();
// demo placement: place 2 demo pieces per side
const f1 = new Fighter(); f1.team='A';
const r1 = new Ranger(); r1.team='A';
const f2 = new Fighter(); f2.team='B';
const r2 = new Ranger(); r2.team='B';
window.BoardState.placePiece(f1, 0, 0);
window.BoardState.placePiece(r1, 2, 0);
window.BoardState.placePiece(f2, 6, 6);
window.BoardState.placePiece(r2, 4, 6);


// place boss in center
const boss = new BossDragon(); boss.team='N';
window.BoardState.placePiece(boss, 3, 3);
this.boss = boss;


this.players[1].pieces = [f1,r1];
this.players[2].pieces = [f2,r2];


this.players[1].hp = f1.maxHp + r1.maxHp;
this.players[2].hp = f2.maxHp + r2.maxHp;


document.getElementById('turnIndicator').textContent = 'Current: Player 1';
if(window.BoardUI) window.BoardUI.redraw();
},

/**
 * Enable/disable AI for a player
 */
setPlayerAI: function(playerNum, enabled) {
this.players[playerNum].isAI = enabled;
console.log(`Player ${playerNum} AI: ${enabled ? 'ON' : 'OFF'}`);
},

/**
 * Get AI-recommended move for current piece
 */
getAIMove: async function(piece) {
if (!window.AIOpponent || !window.AIOpponent.enabled) {
return null;
}

const validMoves = piece.validMoves ? piece.validMoves(window.BoardState) : [];
if (validMoves.length === 0) return null;

try {
const result = await window.AIOpponent.findBestMove(piece, validMoves);
return result;
} catch (error) {
console.error('AI move evaluation failed:', error);
return null;
}
},

/**
 * Execute AI turn
 */
executeAITurn: async function() {
const player = this.players[this.currentPlayer];
if (!player.isAI) return false;

console.log(`[AI Turn] Player ${this.currentPlayer} is thinking...`);
const pieces = player.pieces.filter(p => p.currentHp > 0);

if (pieces.length === 0) return false;

for (const piece of pieces) {
const validMoves = piece.validMoves ? piece.validMoves(window.BoardState) : [];
if (validMoves.length > 0) {
try {
const aiResult = await this.getAIMove(piece);
if (aiResult && aiResult.move) {
const [toX, toY] = aiResult.move;
window.BoardState.movePiece(piece.x, piece.y, toX, toY);
console.log(`[AI] ${piece.name} moved to (${toX},${toY})`);
console.log(`Reasoning: ${aiResult.reasoning}`);
}
} catch (error) {
console.error(`AI error for ${piece.name}:`, error);
}
}
}

// End AI turn
this.endTurn();
return true;
},

endTurn: function(){
// swap players and have boss take a trivial turn
this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
document.getElementById('turnIndicator').textContent = `Current: Player ${this.currentPlayer}`;
if(this.boss && this.boss.takeTurn) this.boss.takeTurn(window.BoardState);
if(window.BoardUI) window.BoardUI.redraw();

// If new player is AI, execute AI turn
if (this.players[this.currentPlayer].isAI) {
setTimeout(() => this.executeAITurn(), 1000);
}
}
};


window.GameManager = GM;
})();