// bossDragon.js — simplified boss placeholder
(function(){
function BossDragon(){
Champion.call(this, 'Dragon', 20);
this.isBoss = true;
}
BossDragon.prototype = Object.create(Champion.prototype);
BossDragon.prototype.constructor = BossDragon;


BossDragon.prototype.takeTurn = function(boardState){
// placeholder dragon behavior: do nothing for now
};


window.BossDragon = BossDragon;
})();