// help.js — provides instructions text
(function(){
const helpText = `
<h3>How to Play (Summary)</h3>
<p>Avengement is a 2-player turn-based board game with champions and a boss on a 7×7 grid.
Players pick 3 champions each, place them on their starting row, and take turns using AP to move
and cast abilities. The boss moves after each player turn.</p>


<h4>AP & HP</h4>
<ul>
<li>Each player starts with 3 AP.</li>
<li>Resting at end-step gains 1 AP and 1 HP (max 6 AP; HP capped at starting total).</li>
</ul>


<h4>Turn Order (4-step cycle)</h4>
<ol><li>Player 1</li><li>Boss Monster</li><li>Player 2</li><li>Boss Monster</li></ol>


<h4>Champion examples</h4>
<p>Fighter (HP 7): move 2 squares, Strike deals 2 damage to adjacent squares, etc.</p>
`;


window.Help = {
getHelpHtml: () => helpText
};
})();