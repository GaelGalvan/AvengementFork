(function(){
function Fighter(){
Champion.call(this, 'Fighter', 7);
}
Fighter.prototype = Object.create(Champion.prototype);
Fighter.prototype.constructor = Fighter;


Fighter.prototype.validMoves = function(boardState){
// move up to 2 squares omnidirectionally (no collision checks yet)
const moves = [];
for(let dx=-2; dx<=2; dx++){
for(let dy=-2; dy<=2; dy++){
if(dx===0 && dy===0) continue;
// simple euclidean constraint: allow up to 2 steps in Manhattan
if(Math.abs(dx)+Math.abs(dy) <= 2) moves.push([this.x+dx, this.y+dy]);
}
}
return moves;
};


window.Fighter = Fighter;
})();