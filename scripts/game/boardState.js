// boardState.js — tracks piece positions on a 7x7 grid
(function(){
const SIZE = 7;
function BoardState(){
this.size = SIZE;
this.grid = Array.from({length:SIZE}, () => Array(SIZE).fill(null));
}


BoardState.prototype.placePiece = function(piece,x,y){
piece.setPos(x,y);
this.grid[y][x] = piece;
};


BoardState.prototype.getPiece = function(x,y){
if(x<0||y<0||x>=this.size||y>=this.size) return null;
return this.grid[y][x];
};


BoardState.prototype.movePiece = function(x1,y1,x2,y2){
const p = this.getPiece(x1,y1);
if(!p) return false;
this.grid[y1][x1] = null;
this.grid[y2][x2] = p;
p.setPos(x2,y2);
return true;
};


BoardState.prototype.clear = function(){
this.grid = Array.from({length:SIZE}, () => Array(SIZE).fill(null));
};


window.BoardState = new BoardState();
})();