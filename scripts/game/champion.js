// champion.js — base champion class
(function(){
function Champion(name, hp){
this.name = name;
this.maxHp = hp;
this.currentHp = hp;
this.ap = 3; // default per-player AP tracked in GameManager
this.team = null;
this.x = -1; this.y = -1;
}


Champion.prototype.setPos = function(x,y){ this.x=x; this.y=y; };
Champion.prototype.takeDamage = function(n){ this.currentHp = Math.max(0, this.currentHp - n); };


window.Champion = Champion;
})();