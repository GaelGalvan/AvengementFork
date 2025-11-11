// boardUI.js — draws the 7x7 board and handles basic clicks
(function(){
const BOARD_SIZE = 7;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const CELL = Math.floor(canvas.width / BOARD_SIZE);


function drawGrid(boardState){
ctx.clearRect(0,0,canvas.width, canvas.height);
for(let y=0;y<BOARD_SIZE;y++){
for(let x=0;x<BOARD_SIZE;x++){
const light = (x+y)%2===0;
ctx.fillStyle = light ? '#f0e9d8' : '#5b4636';
ctx.fillRect(x*CELL, y*CELL, CELL, CELL);
}
}


// draw pieces from boardState
for(let y=0;y<BOARD_SIZE;y++){
for(let x=0;x<BOARD_SIZE;x++){
const p = boardState.getPiece(x,y);
if(p) drawPiece(x,y,p);
}
}
}


function drawPiece(x,y,p){
const cx = x*CELL + CELL/2;
const cy = y*CELL + CELL/2;
ctx.beginPath();
ctx.arc(cx, cy, CELL*0.32, 0, Math.PI*2);
ctx.fillStyle = p.team === 'A' ? '#2575fc' : '#f43b57';
ctx.fill();
ctx.fillStyle = '#fff';
ctx.font = `${Math.floor(CELL*0.22)}px sans-serif`;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText(p.name ? p.name[0] : '?', cx, cy);
}


// click handling: select and naive move (no rules)
let selected = null;
canvas.addEventListener('click', (ev) => {
const r = canvas.getBoundingClientRect();
const mx = ev.clientX - r.left;
const my = ev.clientY - r.top;
const x = Math.floor(mx / CELL);
const y = Math.floor(my / CELL);
if(!window.BoardState) return;
const bs = window.BoardState;
const piece = bs.getPiece(x,y);
if(selected){
// move
bs.movePiece(selected.x, selected.y, x, y);
selected = null;
window.GameManager.endTurn();
drawGrid(bs);
return;
}
if(piece){
selected = {x,y};
}
});


window.BoardUI = {
init: function(){
if(!window.BoardState) return;
drawGrid(window.BoardState);
},
redraw: function(){
if(!window.BoardState) return;
drawGrid(window.BoardState);
}
};
})();