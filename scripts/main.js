// main.js — entrypoint for UI nav and wiring
window.addEventListener('DOMContentLoaded', () => {
// simple screen system
const screens = document.querySelectorAll('.screen');
function show(id){
screens.forEach(s => s.classList.remove('active'));
const el = document.getElementById(id);
if(el) el.classList.add('active');
}


// nav buttons
document.getElementById('nav-main').addEventListener('click', () => show('screen-main'));
document.getElementById('nav-settings').addEventListener('click', () => show('screen-settings'));
document.getElementById('nav-help').addEventListener('click', () => show('screen-help'));
document.getElementById('nav-about').addEventListener('click', () => show('screen-about'));


document.getElementById('startBtn').addEventListener('click', () => {
show('screen-game');
// initialize board UI
if(window.BoardUI) window.BoardUI.init();
if(window.GameManager) window.GameManager.init();
});


document.getElementById('resetBtn').addEventListener('click', () => {
if(window.GameManager) window.GameManager.reset();
});


// load help content
if(window.Help) {
const hc = document.getElementById('helpContent');
hc.innerHTML = window.Help.getHelpHtml();
}
});