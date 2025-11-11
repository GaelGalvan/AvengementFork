// ranger.js
(function(){
function Ranger(){
Champion.call(this, 'Ranger', 4);
}
Ranger.prototype = Object.create(Champion.prototype);
Ranger.prototype.constructor = Ranger;


Ranger.prototype.validMoves = function(boardState){
const moves = [];
const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
dirs.forEach(d => moves.push([this.x + d[0], this.y + d[1]]));
return moves;
};


window.Ranger = Ranger;
})();