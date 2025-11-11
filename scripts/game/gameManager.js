// gameManager.js — basic turn manager and demo setup
(function(){
const GM = {
currentPlayer: 1,
players: {
1: {ap:3, hp:0, pieces:[]},
2: {ap:3, hp:0, pieces:[]}
},
boss: null,
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
endTurn: function(){
// swap players and have boss take a trivial turn
this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
document.getElementById('turnIndicator').textContent = `Current: Player ${this.currentPlayer}`;
if(this.boss && this.boss.takeTurn) this.boss.takeTurn(window.BoardState);
if(window.BoardUI) window.BoardUI.redraw();
}
};


window.GameManager = GM;
})();