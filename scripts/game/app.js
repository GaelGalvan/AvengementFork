// app.js — game UI and logic refactored to use Champion objects (fighter/ranger/dragon)
(function(){
document.addEventListener('DOMContentLoaded', ()=>{
  /* ---------- config & state ---------- */
  const ROWS = 7, COLS = 7, MAX_AP = 6;
  const CHAMP_REG = { fighter: window.Fighter, ranger: window.Ranger };
  let grid = Array.from({length:ROWS}, ()=> Array(COLS).fill(null));
  let pieces = {}; // id -> Champion instance
  let setupTurn = 'ally';
  let phase = 'setup';
  let setupPlaced = { ally:[], enemy:[] };
  let selectedChampionType = 'fighter';
  let dragonId = null;

  // players
  const player = {
    ally: {hpTotal:0, hpCurrent:0, ap:3, segmentIndex:3, lastHit:null},
    enemy:{hpTotal:0, hpCurrent:0, ap:3, segmentIndex:3, lastHit:null}
  };

  // runtime
  let currentStepIndex = 0; // 0: ally, 1: boss, 2: enemy, 3: boss
  const cycle = ['ally','boss','enemy','boss'];
  let currentActor = null;
  let selectedId = null;
  let activeAction = null;
  let bullSpend = 1;
  let pendingRestRewards = {}; // Track pending rest rewards per piece
  
  // Strength passive state
  let strengthPending = null; // { attackerId, targetId } when Strength can be used
  
  // Ranger Focused Stance state
  let focusedRangerId = null; // id of ranger with focused stance active this turn

  // Dragon displacement state
  let dragonDisplacingPiece = null; // { targetId, originR, originC } when Dragon displaces a piece

  /* ---------- UI refs ---------- */
  const boardEl = document.getElementById('board');
  const btnFighter = document.getElementById('btnFighter');
  const btnRanger = document.getElementById('btnRanger');
  const finishBtn = document.getElementById('finishBtn');
  const resetBtn = document.getElementById('resetBtn');
  const phaseLabel = document.getElementById('phaseLabel');
  const setupTitle = document.getElementById('setupTitle');
  const setupHint = document.getElementById('setupHint');

  const hpAllyEl = document.getElementById('hpAlly');
  const hpEnemyEl = document.getElementById('hpEnemy');
  const apAllyEl = document.getElementById('apAlly');
  const apEnemyEl = document.getElementById('apEnemy');

  const turnLabel = document.getElementById('turnLabel');
  const selName = document.getElementById('selName');
  const selHP = document.getElementById('selHP');


  const btnMove = document.getElementById('btnMove');
  const btnPassive = document.getElementById('btnA1');
  const btnAbility = document.getElementById('btnA2');
  const btnUltimate = document.getElementById('btnA3');
  const btnRest = document.getElementById('btnRest');
  const btnEndTurn = document.getElementById('btnEndTurn');
  const bullInput = document.getElementById('bullInput');
  const bullSet = document.getElementById('bullSet');
  const bullBox = document.getElementById('bullBox');

  const logEl = document.getElementById('log');
  
  // Right sidebar / card display elements
  const cardTitle = document.getElementById('cardTitle');
  const cardImage = document.getElementById('cardImage');
  const cardStats = document.getElementById('cardStats');
  const cardHP = document.getElementById('cardHP');
  const cardMove = document.getElementById('cardMove');
  const cardState = document.getElementById('cardState');
  const cardAbilityList = document.getElementById('cardAbilityList');

  const strengthPrompt = document.getElementById('strengthPrompt');
  const btnStrengthYes = document.getElementById('btnStrengthYes');
  const btnStrengthNo = document.getElementById('btnStrengthNo');

  /* ---------- strength passive handlers ---------- */
  btnStrengthYes.addEventListener('click', ()=>{
    if(!strengthPending) return;
    const attacker = pieces[strengthPending.attackerId];
    const target = pieces[strengthPending.targetId];
    if(!attacker || !target){ strengthPending = null; strengthPrompt.style.display = 'none'; return; }
    if(player[attacker.player].ap < 1){ log('Not enough AP for Strength (1 AP required)'); return; }
    // Activate Strength: displace target to adjacent square
    player[attacker.player].ap -= 1;
    log(`${attacker.id} used Strength (1 AP): displacing ${target.id}...`);
    activeAction = 'strength-displace';
    highlightAdjEmpty(target.r, target.c);
    log('Strength: click an adjacent empty tile to displace the enemy.');
    strengthPrompt.style.display = 'none';
    // DO NOT set strengthPending to null here — it's needed in resolveActionOn()
  });

  btnStrengthNo.addEventListener('click', ()=>{
    strengthPending = null;
    strengthPrompt.style.display = 'none';
    log('Strength not used.');
  });

  /* ---------- helpers ---------- */
  function log(msg){ const d = document.createElement('div'); d.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`; logEl.prepend(d); }
  function inBounds(r,c){ return r>=0 && r<ROWS && c>=0 && c<COLS; }
  function emptyGrid(){ grid = Array.from({length:ROWS}, ()=> Array(COLS).fill(null)); pieces = {}; dragonId = null; selectedId = null; activeAction = null; }
  function hpOf(p){ return ('currentHp' in p) ? p.currentHp : (p.hp || 0); }

  // Queen-like movement: can move along rows, columns, or diagonals
  function isQueenAccessible(fromR, fromC, toR, toC, maxDist){
    const dR = toR - fromR;
    const dC = toC - fromC;
    if(dR === 0 && dC === 0) return false; // same position
    const dist = Math.max(Math.abs(dR), Math.abs(dC));
    if(dist > maxDist) return false;
    // Check if on same row, column, or diagonal
    if(dR === 0) return true; // same row
    if(dC === 0) return true; // same column
    if(Math.abs(dR) === Math.abs(dC)) return true; // diagonal
    return false;
  }

  /* ---------- render ---------- */
  function clearHighlights(){ boardEl.querySelectorAll('.cell').forEach(cell=>cell.classList.remove('move','attack','valid')); }


  function render(){
    boardEl.innerHTML = '';
    for(let r=0;r<ROWS;r++){
      for(let c=0;c<COLS;c++){
        const cell = document.createElement('div');
        cell.className = 'cell'; cell.dataset.r = r; cell.dataset.c = c;
        const pid = grid[r][c];
        if(pid){ 
          const p = pieces[pid];
          if(!p){ 
            log(`ERROR: grid[${r}][${c}] = ${pid} but pieces[${pid}] is null!`); 
            cell.classList.add('occupied'); 
          } else {
            cell.classList.add('occupied'); 
            const el = document.createElement('div'); 
            el.className = 'piece ' + (p.player === 'ally' ? 'ally' : (p.player === 'enemy' ? 'enemy' : 'boss')); 
            if(selectedId === pid) el.classList.add('selected'); 
            el.textContent = p.player==='boss' ? '🐉' : (p.champion === 'fighter' ? '⚔' : '🏹'); 
            el.title = `${pid} — ${p.player} — ${p.champion || p.name} — HP ${hpOf(p)}`; 
            if(p.rested){ const ind = document.createElement('div'); ind.className='rest-indicator'; ind.textContent='🛌'; el.appendChild(ind); } 
            cell.appendChild(el); 
          }
        }
        cell.addEventListener('click', onCellClick);
        boardEl.appendChild(cell);
      }
    }
    updateSidebar();
    updateAbilityUI();
    updateClassCard();
  }

  // Update ability UI to show only relevant buttons for selected champion
  function updateAbilityUI() {
    // Hide all by default
    btnMove.style.display = 'none';
    btnPassive.style.display = 'none';
    btnAbility.style.display = 'none';
    btnRest.style.display = 'none';
    if (btnUltimate) btnUltimate.style.display = 'none';
    if (bullBox) bullBox.style.display = 'none';

    if (!selectedId || !pieces[selectedId]) return;
    const p = pieces[selectedId];
    // Move always available if not rested
    if (!p.rested) btnMove.style.display = '';
    // Show context-sensitive abilities
    if (p.champion === 'fighter') {
      btnPassive.style.display = '';
      btnPassive.textContent = 'Strike (1 AP)';
      btnAbility.style.display = '';
      btnAbility.textContent = 'Lunging Strikes (3 AP)';
      // No ultimate for fighter yet
    } else if (p.champion === 'ranger') {
      btnPassive.style.display = '';
      btnPassive.textContent = 'Focused Stance (1 AP)';
      btnAbility.style.display = '';
      btnAbility.textContent = 'Quick Shot (1 AP)';
      if (bullBox) bullBox.style.display = '';
      // Bullseye is shown separately
    } else if (p.champion === 'dragon') {
      btnPassive.style.display = '';
      btnPassive.textContent = 'Firebreath (Passive)';
      btnAbility.style.display = '';
      btnAbility.textContent = 'Strengthen (Buff)';
      if (btnUltimate) {
        btnUltimate.style.display = '';
        btnUltimate.textContent = 'Focused Assault (Ultimate)';
      }
    }
    // Rest always available if not acted or rested
    if (!p.rested && !p.acted) btnRest.style.display = '';
  }

  // Update class card display for selected piece
  function updateClassCard() {
    if (!selectedId || !pieces[selectedId]) {
      cardTitle.textContent = 'Select a piece to view details';
      cardImage.textContent = '[Class Image Placeholder]';
      cardStats.style.display = 'none';
      cardAbilityList.textContent = 'No piece selected';
      return;
    }
    
    const p = pieces[selectedId];
    const name = p.champion ? p.champion.charAt(0).toUpperCase() + p.champion.slice(1) : (p.name || '?');
    const emoji = p.player === 'boss' ? '🐉' : (p.champion === 'fighter' ? '⚔' : '🏹');
    
    cardTitle.textContent = `${emoji} ${name} (${p.id})`;
    cardImage.textContent = `[${name} Class Image]`;
    
    // Show stats
    cardStats.style.display = 'flex';
    cardHP.textContent = `${hpOf(p)} / ${p.maxHp || 20}`;
    cardMove.textContent = p.move || 1;
    const stateText = p.rested ? 'Resting' : (p.acted ? 'Acted' : 'Ready');
    cardState.textContent = stateText;
    
    // Show abilities
    let abilitiesHTML = '';
    if (p.champion === 'fighter') {
      abilitiesHTML = `
        <div style="margin-bottom:6px"><strong>Passive: Strength</strong></div>
        <div style="margin-bottom:8px">After dealing damage: spend 1 AP to displace any piece to adjacent square</div>
        <div style="margin-bottom:6px"><strong>Strike</strong> (1 AP)</div>
        <div style="margin-bottom:8px">2 dmg to adjacent piece, then can use Strength</div>
        <div style="margin-bottom:6px"><strong>Lunging Strikes</strong> (3 AP)</div>
        <div style="margin-bottom:8px">2 dmg to all adjacent pieces, free move, then can use Strength</div>
      `;
    } else if (p.champion === 'ranger') {
      abilitiesHTML = `
        <div style="margin-bottom:6px"><strong>Passive: Focused Stance</strong></div>
        <div style="margin-bottom:8px">Spend 1 AP to focus: next turn all ability ranges double. Cannot act rest of turn.</div>
        <div style="margin-bottom:6px"><strong>Quick Shot</strong> (1 AP)</div>
        <div style="margin-bottom:8px">1 dmg, range 3 (doubled if focused)</div>
        <div style="margin-bottom:6px"><strong>Bullseye</strong> (X AP)</div>
        <div style="margin-bottom:8px">2X dmg, range 3 (doubled if focused), 1 turn cooldown</div>
      `;
    } else if (p.champion === 'dragon') {
      abilitiesHTML = `
        <div style="margin-bottom:6px"><strong>Passive: Firebreath</strong></div>
        <div style="margin-bottom:8px">3 dmg to all adjacent (triggered by roll)</div>
        <div style="margin-bottom:6px"><strong>Strengthen</strong></div>
        <div style="margin-bottom:8px">Next attack deals +2 dmg</div>
        <div style="margin-bottom:6px"><strong>Focused Assault</strong> (2 AP)</div>
        <div style="margin-bottom:8px">2 dmg to all enemies, range 2</div>
      `;
    }
    cardAbilityList.innerHTML = abilitiesHTML;
  }

  function updateSidebar(){
    hpAllyEl.textContent = `${player.ally.hpCurrent} / ${player.ally.hpTotal || 0}`;
    hpEnemyEl.textContent = `${player.enemy.hpCurrent} / ${player.enemy.hpTotal || 0}`;
    apAllyEl.textContent = `${player.ally.ap}`;
    apEnemyEl.textContent = `${player.enemy.ap}`;
    phaseLabel.textContent = `Phase: ${phase}`;
    turnLabel.textContent = currentActor ? `Turn: ${currentActor === 'ally' ? 'Player 1' : (currentActor === 'enemy' ? 'Player 2' : 'Dragon')}` : 'Turn: —';
    if(selectedId && pieces[selectedId]){ selName.textContent = selectedId + ' (' + (pieces[selectedId].champion||pieces[selectedId].name) + ')'; selHP.textContent = hpOf(pieces[selectedId]); }
    else { selName.textContent = '—'; selHP.textContent = '—'; }
  }

  /* ---------- setup placement ---------- */
  btnFighter.addEventListener('click', ()=>{ selectedChampionType='fighter'; btnFighter.classList.add('active'); btnRanger.classList.remove('active'); });
  btnRanger.addEventListener('click', ()=>{ selectedChampionType='ranger'; btnRanger.classList.add('active'); btnFighter.classList.remove('active'); });

  function placeForSetup(r,c){
    const validRow = setupTurn === 'ally' ? 0 : ROWS - 1;
    if(r !== validRow){ log(`Place only on row ${validRow}`); return; }
    if(grid[r][c]){ log('Cell occupied'); return; }
    if(setupPlaced[setupTurn].length >= 3){ log('Already placed 3'); return; }
    const idx = setupPlaced[setupTurn].length;
    const id = (setupTurn === 'ally' ? 'A' : 'E') + idx;
    const Klass = CHAMP_REG[selectedChampionType];
    const inst = new Klass();
    inst.id = id; inst.player = setupTurn; inst.champion = selectedChampionType; inst.rested = false; inst.acted = false; inst.cooldowns = {};
    // normalize fields to match expected names used elsewhere
    if(inst.currentHp === undefined && inst.maxHp !== undefined) inst.currentHp = inst.maxHp;
    // ensure position is set
    inst.r = r; inst.c = c;
    pieces[id] = inst; grid[r][c] = id; setupPlaced[setupTurn].push(id);
    log(`${setupTurn === 'ally' ? 'Player1' : 'Player2'} placed ${selectedChampionType} at (${r},${c})`);
    render();
    if(setupPlaced[setupTurn].length === 3) finishBtn.disabled = false;
  }

  finishBtn.addEventListener('click', ()=>{
    if(setupTurn === 'ally'){
      setupTurn = 'enemy'; setupTitle.textContent = 'Player 2 — Place 3 champions'; finishBtn.textContent = 'Finish Player 2'; finishBtn.disabled = true; btnFighter.classList.add('active'); btnRanger.classList.remove('active'); selectedChampionType='fighter'; setupHint.textContent = 'Player 2: choose and place 3 units on row 6.';
    } else {
      phase = 'inprogress'; setupTitle.textContent = 'Setup Complete'; setupHint.textContent = 'Game started! Player 1 goes first.'; finishBtn.style.display='none'; resetBtn.style.display='none'; computePools(); placeDragon(); currentStepIndex = 0; currentActor = cycle[currentStepIndex]; render(); log('Setup complete. Game begins! Player 1 (ally) goes first.');
    }
  });

  resetBtn.addEventListener('click', ()=>{
    phase='setup'; setupTurn='ally'; setupPlaced={ally:[],enemy:[]}; selectedChampionType='fighter'; btnFighter.classList.add('active'); btnRanger.classList.remove('active'); finishBtn.disabled=true; finishBtn.textContent='Finish Player 1'; setupTitle.textContent='Player 1 — Place 3 champions'; setupHint.textContent='Choose champion type then click tiles on your starting row to place.'; emptyGrid(); render(); log('Setup reset.');
  });

  function computePools(){
    const allySum = setupPlaced.ally.reduce((s,id)=> s + (hpOf(pieces[id]) || 0), 0);
    const enemySum = setupPlaced.enemy.reduce((s,id)=> s + (hpOf(pieces[id]) || 0), 0);
    player.ally.hpTotal = allySum; player.ally.hpCurrent = allySum; player.ally.ap = 3; player.ally.segmentIndex = 3; player.ally.lastHit = null;
    player.enemy.hpTotal = enemySum; player.enemy.hpCurrent = enemySum; player.enemy.ap = 3; player.enemy.segmentIndex = 3; player.enemy.lastHit = null;
  }

  function placeDragon(){
    const r = Math.floor(ROWS/2), c = Math.floor(COLS/2); 
    const id = 'B0'; 
    const boss = new window.BossDragon(); 
    boss.id = id; 
    boss.player = 'boss'; 
    boss.champion = 'dragon'; 
    boss.rested = false; 
    boss.acted = false;
    boss.cooldowns = {}; 
    boss.r = r; 
    boss.c = c;
    // ensure currentHp is set
    if(boss.currentHp === undefined && boss.maxHp !== undefined) boss.currentHp = boss.maxHp;
    pieces[id] = boss; 
    grid[r][c] = id; 
    dragonId = id; 
    log('Dragon placed at center.');
  }

  /* ---------- interactions / actions ---------- */
  function onCellClick(e){ 
    const cell = e.currentTarget; 
    const r = +cell.dataset.r, c = +cell.dataset.c; 
    if(phase === 'setup'){ placeForSetup(r,c); return; } 
    if(activeAction){ 
      log(`DEBUG: onCellClick routing to resolveActionOn for activeAction=${activeAction} at (${r},${c})`);
      resolveActionOn(r,c); 
      return; 
    } 
    const pid = grid[r][c]; 
    if(pid && pieces[pid]){ 
      const p = pieces[pid]; 
      if(currentActor === null){ log('Click End Turn to begin (Player 1 will go first).'); return; } 
      if(p.player === currentActor){ selectedId = pid; clearActionState(); render(); log(`Selected ${pid}`); } 
      else { log('You can only select pieces that belong to the current actor.'); } 
    } 
  }

  function clearActionState(){ activeAction = null; bullSpend = 1; bullInput.value = 1; clearHighlights(); }

  /* ---------- highlight helpers ---------- */
  function highlightMovesFor(id){ clearHighlights(); const p = pieces[id]; const range = (p.move !== undefined) ? p.move : 1; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){ if(grid[r][c] === null && isQueenAccessible(p.r,p.c,r,c,range)){ const el = boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`); if(el) el.classList.add('move'); } } }

  function highlightAdjEnemies(id){ clearHighlights(); const p = pieces[id]; const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]; for(const d of dirs){ const nr = p.r + d[0], nc = p.c + d[1]; if(inBounds(nr,nc) && grid[nr][nc]){ const tid = grid[nr][nc]; if(pieces[tid]){ const el = boardEl.querySelector(`.cell[data-r="${nr}"][data-c="${nc}"]`); if(el) el.classList.add('attack'); } } } }

  function highlightRanged(id, range){ clearHighlights(); const p = pieces[id]; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){ if(isQueenAccessible(p.r,p.c,r,c,range)){ const cell = boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`); if(!cell) continue; if(grid[r][c] && pieces[grid[r][c]].player !== p.player) cell.classList.add('attack'); else if(grid[r][c] === null) cell.classList.add('valid'); } } }

  function highlightAdjEmpty(r, c){ clearHighlights(); const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]; for(const d of dirs){ const nr = r + d[0], nc = c + d[1]; if(inBounds(nr,nc) && grid[nr][nc] === null){ const el = boardEl.querySelector(`.cell[data-r="${nr}"][data-c="${nc}"]`); if(el) el.classList.add('move'); } } }

  function showStrengthPrompt(attackerId, targetId){
    strengthPending = { attackerId, targetId };
    strengthPrompt.style.display = '';
    log('Strength available! Use it to displace the struck enemy? (sidebar)');
  }

  /* ---------- resolve actions ---------- */

  function resolveActionOn(r,c){
    log(`DEBUG: resolveActionOn called with r=${r}, c=${c}, activeAction=${activeAction}, selectedId=${selectedId}`);
    
    // For displacement actions, selectedId might be null (we're clicking on empty square)
    // For other actions, we need a selected piece
    if(activeAction !== 'dragon-displace' && activeAction !== 'strength-displace'){
      const p = pieces[selectedId];
      if(!p){ clearActionState(); return; }
    }
    
    const p = pieces[selectedId];  // May be null for displacement actions
    // MOVE
    if(activeAction === 'move'){
      const cell = boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
      if(!cell.classList.contains('move')){ log('Invalid move target'); clearActionState(); return; }
      if(player[p.player].ap < 1){ log('Not enough AP for Move'); clearActionState(); return; }
      player[p.player].ap -= 1;
      p.acted = true;
      log(`${p.id} moved to (${r},${c}). AP left: ${player[p.player].ap}`);
      // move piece
      const old = {r:p.r,c:p.c}; grid[old.r][old.c] = null; p.r = r; p.c = c; grid[r][c] = p.id;
      clearActionState(); render(); return;
    }

    // STRIKE (fighter)
    if(activeAction === 'strike'){
      const cell = boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
      if(!cell.classList.contains('attack')){ log('Invalid strike target'); clearActionState(); return; }
      if(player[p.player].ap < 1){ log('Not enough AP for Strike'); clearActionState(); return; }
      const tid = grid[r][c]; if(!tid){ log('No target there'); clearActionState(); return; }
      player[p.player].ap -= 1; p.acted = true;
      let dmg = 2;
      // Dragon Strengthen buff
      if(p.buff && p.buff.type === 'strength') { dmg += 2; p.buff = null; log('Strengthen buff applied!'); }
      applyDamage(p.id, tid, dmg);
      log(`${p.id} used Strike on ${tid} for ${dmg} dmg. AP left ${player[p.player].ap}`);
      clearActionState(); render();
      // Check if target still exists and Strength can be used
      if(pieces[tid] && p.champion === 'fighter'){ showStrengthPrompt(p.id, tid); return; }
      return;
    }

    // LUNGING (fighter)
    if(activeAction === 'lunging'){
      if(player[p.player].ap < 3){ log('Not enough AP for Lunging Strikes'); clearActionState(); return; }
      player[p.player].ap -= 3;
      p.acted = true;
      const adj = getAdjIds(p.r,p.c);
      let hitTargets = [];
      adj.forEach(tid => { if(tid && pieces[tid]){ applyDamage(p.id, tid, 2); hitTargets.push(tid); } });
      log(`${p.id} used Lunging Strikes (2 dmg to adjacent). Choose free adjacent empty tile to move to.`);
      activeAction = 'lunging-move'; clearHighlights(); const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[1,-1],[-1,1]]; let hasMove=false; for(const d of dirs){ const nr=p.r+d[0], nc=p.c+d[1]; if(inBounds(nr,nc) && grid[nr][nc]===null){ const el = boardEl.querySelector(`.cell[data-r="${nr}"][data-c="${nc}"]`); if(el) el.classList.add('move'); hasMove=true; } } if(!hasMove){ log('No free tile for lunging move.'); clearActionState(); render(); } else { p.lungingTargets = hitTargets; } return;
    }

    if(activeAction === 'lunging-move'){
      const cell = boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
      if(!cell.classList.contains('move')){ log('Invalid lunging move target'); clearActionState(); return; }
      grid[p.r][p.c] = null; p.r = r; p.c = c; grid[r][c] = p.id; log(`${p.id} lunged to (${r},${c}).`);
      // After lunging, offer to use Strength on any hit target
      if(p.lungingTargets && p.lungingTargets.length > 0){
        const validTarget = p.lungingTargets.find(tid => pieces[tid]);
        if(validTarget){ showStrengthPrompt(p.id, validTarget); }
      }
      clearActionState(); render(); return;
    }

    // QUICK (ranger)
    if(activeAction === 'quick'){
      const cell = boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
      const range = pieces[selectedId].focused ? 6 : 3;
      const isValidTarget = isQueenAccessible(pieces[selectedId].r, pieces[selectedId].c, r, c, range);
      if(!isValidTarget || !cell.classList.contains('attack')){ log('Invalid Quick Shot target'); clearActionState(); return; }
      if(player[p.player].ap < 1){ log('Not enough AP for Quick Shot'); clearActionState(); return; }
      player[p.player].ap -= 1; p.acted = true; const tid = grid[r][c]; applyDamage(p.id, tid, 1); log(`${p.id} Quick Shot ${tid} for 1 dmg. AP left ${player[p.player].ap}`); clearActionState(); render(); return;
    }

    // BULLSEYE (ranger)
    if(activeAction === 'bullseye'){
      const cell = boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
      const range = pieces[selectedId].focused ? 6 : 3;
      const isValidTarget = isQueenAccessible(pieces[selectedId].r, pieces[selectedId].c, r, c, range);
      if(!isValidTarget || !cell.classList.contains('attack')){ log('Invalid Bullseye target'); clearActionState(); return; }
      if(player[p.player].ap < bullSpend){ log('Not enough AP for Bullseye'); clearActionState(); return; }
      p.cooldowns = p.cooldowns || {};
      if(p.cooldowns.bullseye > 0){ log('Bullseye is on cooldown!'); clearActionState(); return; }
      player[p.player].ap -= bullSpend; p.acted = true; const tid = grid[r][c]; applyDamage(p.id, tid, 2 * bullSpend); p.cooldowns.bullseye = 1; log(`${p.id} used Bullseye on ${tid} for ${2*bullSpend} dmg (spent ${bullSpend} AP, range ${range}).`); clearActionState(); render(); return;
    }

    // STRENGTH DISPLACE (fighter passive)
    if(activeAction === 'strength-displace'){
      const cell = boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
      if(!cell){ log('Cell not found'); return; }
      if(!cell.classList.contains('move')){ log('Invalid displacement target (must be adjacent empty tile)'); return; }
      if(!strengthPending){ log('No target to displace.'); clearActionState(); render(); return; }
      const target = pieces[strengthPending.targetId];
      if(!target){ log('Target no longer exists.'); clearActionState(); render(); return; }
      // Displace target
      grid[target.r][target.c] = null;
      target.r = r;
      target.c = c;
      grid[r][c] = target.id;
      log(`${strengthPending.attackerId} displaced ${target.id} to (${r},${c}).`);
      strengthPending = null;
      strengthPrompt.style.display = 'none';
      clearActionState();
      render();
      return;
    }

    // DRAGON DISPLACE (Dragon movement)
    if(activeAction === 'dragon-displace'){
      log(`DEBUG: dragon-displace handler triggered. activeAction=${activeAction}`);
      // Ensure r and c are numbers
      const row = parseInt(r, 10);
      const col = parseInt(c, 10);
      log(`DEBUG: Attempting to place piece at (${row},${col})`);
      const cell = boardEl.querySelector(`.cell[data-r="${row}"][data-c="${col}"]`);
      if(!cell){ log('DEBUG: Cell not found'); return; }
      log(`DEBUG: Cell found. Has 'move' class: ${cell.classList.contains('move')}`);
      if(!cell.classList.contains('move')){ log('Invalid displacement target (must be adjacent empty tile)'); return; }
      log(`DEBUG: Cell has move class. Checking dragonDisplacingPiece...`);
      if(!dragonDisplacingPiece){ log('No piece to displace.'); clearActionState(); render(); return; }
      log(`DEBUG: dragonDisplacingPiece=${JSON.stringify(dragonDisplacingPiece)}`);
      
      // Verify the cell is actually empty
      if(grid[row][col] !== null){ 
        log(`Cell (${row},${col}) is not empty! Contains: ${grid[row][col]}`);
        return;
      }
      
      const targetId = dragonDisplacingPiece.targetId;
      const target = pieces[targetId];
      log(`DEBUG: targetId=${targetId}, target exists=${!!target}`);
      if(!target){ log('Target no longer exists.'); clearActionState(); render(); return; }
      
      // Place the piece at the chosen location
      target.r = row;
      target.c = col;
      grid[row][col] = targetId;
      log(`${targetId} placed at (${row},${col})`);
      
      // Apply damage to the displaced piece
      const boss = pieces[dragonId];
      if(boss){
        log(`Dragon applying 3 damage to ${targetId}...`);
        applyDamage(boss.id, targetId, 3);
      }
      
      dragonDisplacingPiece = null;
      clearActionState();
      render();
      
      // Now advance to next turn
      currentStepIndex = (currentStepIndex + 1) % cycle.length;
      currentActor = cycle[currentStepIndex];
      log(`After Dragon displacement, it is now ${currentActor === 'ally' ? 'Player 1' : 'Player 2'}'s turn.`);
      
      // Reset pieces for the next actor
      if(currentActor === 'ally' || currentActor === 'enemy'){
        const pk = currentActor;
        for(const id in pieces){
          if(pieces[id].player === pk){
            pieces[id].rested = false;
            pieces[id].acted = false;
            // Apply focused state if this ranger was set to focus last turn
            if(focusedRangerId === id && pieces[id].champion === 'ranger'){
              pieces[id].focused = true;
              log(`${id} is focused! Ability ranges are doubled this turn.`);
              focusedRangerId = null;
            } else {
              pieces[id].focused = false;
            }
            // Decrement cooldowns
            if(pieces[id].cooldowns){
              for(const key in pieces[id].cooldowns){
                if(pieces[id].cooldowns[key] > 0) pieces[id].cooldowns[key]--;
              }
            }
            // Remove expired buffs
            if(pieces[id].buff && pieces[id].buff.turns){
              pieces[id].buff.turns--;
              if(pieces[id].buff.turns <= 0) pieces[id].buff = null;
            }
          }
        }
      }
      render();
      return;
    }
  }

  function getAdjIds(r,c){ const out=[]; const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]; for(const d of dirs){ const nr=r+d[0], nc=c+d[1]; if(inBounds(nr,nc)) out.push(grid[nr][nc]); } return out; }

  function applyDamage(attackerId, targetId, dmg){ const attacker = pieces[attackerId]; const target = pieces[targetId]; if(!target) return; if(target.player === 'boss'){ target.currentHp = (target.currentHp || target.maxHp) - dmg; log(`${attackerId} did ${dmg} to Dragon (HP ${target.currentHp})`); if(target.currentHp <= 0){ log('Dragon died!'); deletePiece(target.id); } return; } target.currentHp = (target.currentHp || target.maxHp) - dmg; player[target.player].hpCurrent = Math.max(0, player[target.player].hpCurrent - dmg); player[target.player].lastHit = attackerId; log(`${attackerId} hit ${targetId} for ${dmg}. ${targetId} HP=${target.currentHp}. Owner pool ${player[target.player].hpCurrent}`); if(target.currentHp <= 0){ log(`${targetId} died.`); deletePiece(targetId); player[target.player].ap = Math.min(MAX_AP, player[target.player].ap + 1); log(`${target.player === 'ally' ? 'Player1' : 'Player2'} gained +1 AP (Avengement).`); } checkSegmentation(target.player); }

  function deletePiece(id){ 
    if(!pieces[id]) return; 
    const p = pieces[id]; 
    // Only clear grid if piece position is in bounds and points to this piece
    if(inBounds(p.r, p.c) && grid[p.r][p.c] === id) {
      grid[p.r][p.c] = null;
    }
    delete pieces[id]; 
    setupPlaced.ally = setupPlaced.ally.filter(x=>x!==id); 
    setupPlaced.enemy = setupPlaced.enemy.filter(x=>x!==id); 
    if(selectedId === id) selectedId = null; 
    render(); 
  }

  function checkSegmentation(playerKey){ const total = player[playerKey].hpTotal || 0; if(total === 0) return; const seg = Math.floor(total / 3); const thresholds = [0, seg, seg*2, seg*3]; if(player[playerKey].segmentIndex === undefined) player[playerKey].segmentIndex = 3; let newIndex = 3; const cur = player[playerKey].hpCurrent; if(cur <= thresholds[1]) newIndex = 1; else if(cur <= thresholds[2]) newIndex = 2; else newIndex = 3; if(newIndex < player[playerKey].segmentIndex){ const victim = player[playerKey].lastHit; if(victim && pieces[victim] && pieces[victim].player === playerKey){ log(`Threshold crossed — removing last-hit champion ${victim}`); deletePiece(victim); } else { log('Threshold crossed but no last-hit champion to remove.'); } player[playerKey].segmentIndex = newIndex; } }

  /* ---------- ui action bindings ---------- */
  btnMove.addEventListener('click', ()=>{
    if(!selectedId || !pieces[selectedId]){ log('Select a piece first'); return; }
    const p = pieces[selectedId]; if(p.player !== currentActor){ log('You can only control pieces on your turn'); return; } if(player[p.player].ap < 1){ log('Not enough AP to move'); return; } if(p.rested){ log('This piece is rested and cannot act this turn'); return; } activeAction = 'move'; highlightMovesFor(selectedId); log('Move: click highlighted tile to move.');
  });


  // Passive/Ability/Ultimate event handlers (context-sensitive)
  btnPassive.addEventListener('click', ()=>{
    if(!selectedId){ log('Select a piece first'); return; }
    const p = pieces[selectedId];
    if(p.player !== currentActor){ log('Not current actor piece'); return; }
    if(p.rested){ log('This piece is rested'); return; }
    if(p.champion === 'fighter'){
      // Strike: 1 AP, 2 dmg to adjacent enemy
      if(player[p.player].ap < 1){ log('Not enough AP for Strike'); return; }
      activeAction = 'strike';
      highlightAdjEnemies(selectedId);
      log('Strike: click adjacent enemy to hit (2 dmg)');
    } else if(p.champion === 'ranger'){
      // Focused Stance: 1 AP, doubles next turn's ability ranges, can't act rest of turn
      if(player[p.player].ap < 1){ log('Not enough AP for Focused Stance'); return; }
      player[p.player].ap -= 1;
      p.acted = true;
      p.focused = true;
      focusedRangerId = p.id;
      log(`${p.id} used Focused Stance (1 AP). Next turn all ability ranges will be doubled!`);
      clearActionState();
      render();
    } else if(p.champion === 'dragon'){
      // Firebreath: passive, 3 dmg to all adjacent enemies (no AP cost, only on dragon's turn)
      if(currentActor !== 'boss'){ log('Only the Dragon can use this on its turn.'); return; }
      const adj = getAdjIds(p.r,p.c);
      let hit = false;
      adj.forEach(tid => { if(tid && pieces[tid] && pieces[tid].player !== 'boss'){ applyDamage(p.id, tid, 3); hit = true; } });
      if(hit) log('Dragon used Firebreath (3 dmg to all adjacent)');
      else log('No adjacent enemies for Firebreath.');
      p.acted = true;
      clearActionState();
      render();
    }
  });

  btnAbility.addEventListener('click', ()=>{
    if(!selectedId){ log('Select a piece first'); return; }
    const p = pieces[selectedId];
    if(p.player !== currentActor){ log('Not current actor piece'); return; }
    if(p.rested){ log('This piece is rested'); return; }
    if(p.champion === 'fighter'){
      // Lunging Strikes: 3 AP, 2 dmg to all adjacent, then free adjacent move
      if(player[p.player].ap < 3){ log('Not enough AP for Lunging Strikes'); return; }
      activeAction = 'lunging';
      highlightAdjEnemies(selectedId);
      log('Lunging Strikes: confirm to damage all adjacent (2 dmg), then free adjacent move');
    } else if(p.champion === 'ranger'){
      // Quick Shot: 1 AP, 1 dmg, range 3 or 6 if focused
      if(player[p.player].ap < 1){ log('Not enough AP for Quick Shot'); return; }
      activeAction = 'quick';
      const range = p.focused ? 6 : 3;
      highlightRanged(selectedId, range);
      log(`Quick Shot: click enemy within ${range} tiles (1 dmg)`);
    } else if(p.champion === 'dragon'){
      // Strengthen: buff self, next attack deals +2 dmg (1 turn buff)
      p.buff = { type: 'strength', turns: 1 };
      log('Dragon used Strengthen: next attack deals +2 dmg.');
      p.acted = true;
      clearActionState();
      render();
    }
  });

  if(btnUltimate){
    btnUltimate.addEventListener('click', ()=>{
      if(!selectedId){ log('Select a piece first'); return; }
      const p = pieces[selectedId];
      if(p.player !== currentActor){ log('Not current actor piece'); return; }
      if(p.rested){ log('This piece is rested'); return; }
      if(p.champion === 'dragon'){
        // Focused Assault: 2 AP, attack all enemies in range 2 for 2 dmg (ignores rest/acted)
        if(player[p.player].ap < 2){ log('Not enough AP for Focused Assault'); return; }
        player[p.player].ap -= 2;
        let hit = false;
        for(let id in pieces){
          const t = pieces[id];
          if(t.player !== 'boss' && isQueenAccessible(p.r,p.c,t.r,t.c,2)){
            applyDamage(p.id, id, 2);
            hit = true;
          }
        }
        if(hit) log('Dragon used Focused Assault (2 dmg to all enemies in range 2)');
        else log('No targets for Focused Assault.');
        p.acted = true;
        clearActionState();
        render();
      }
    });
  }

  bullSet.addEventListener('click', ()=>{ 
    if(!selectedId){ log('Select a piece first'); return; }
    const p = pieces[selectedId];
    if(p.player !== currentActor){ log('Not current actor piece'); return; }
    if(p.rested){ log('This piece is rested'); return; }
    if(p.champion !== 'ranger'){ log('Only Rangers can use Bullseye'); return; }
    // Bullseye: spend X AP, 2X dmg, range 3 or 6 if focused, 1 turn cooldown
    bullSpend = Math.max(1, parseInt(bullInput.value,10) || 1);
    if(player[p.player].ap < bullSpend){ log('Not enough AP for Bullseye'); return; }
    p.cooldowns = p.cooldowns || {};
    if(p.cooldowns.bullseye > 0){ log('Bullseye is on cooldown!'); return; }
    activeAction = 'bullseye';
    const range = p.focused ? 6 : 3;
    highlightRanged(selectedId, range);
    log(`Bullseye prepared (spend ${bullSpend} AP, range ${range}): click enemy within ${range} tiles`);
  });

  btnRest.addEventListener('click', ()=>{
    if(!selectedId || !pieces[selectedId]){ log('Select a piece first'); return; }
    const p = pieces[selectedId];
    if(p.player !== currentActor){ log('Can only rest on your turn'); return; }
    if(p.rested){ log('This piece already rested'); return; }
    if(p.acted){ log('Cannot rest: piece has already acted this turn'); return; }
    p.rested = true;
    // Store pending rest rewards to be applied at end of turn
    pendingRestRewards[p.id] = { ap: 1, hp: 1 };
    log(`${p.id} rested — owner will gain +1 AP & +1 HP at end of turn`);
    clearActionState();
    render();
  });

  /* ---------- boss automatic behavior ---------- */
  function bossAct(){ 
    const boss = pieces[dragonId]; 
    if(!boss) return; 
    log('Dragon rolls a d6...'); 
    const v = Math.floor(Math.random()*6)+1; 
    log(`Dragon rolled ${v}`); 
    if(v>=1 && v<=4){ 
      const map = {1:[-1,0],2:[0,1],3:[0,-1],4:[1,0]}; 
      let [dr,dc] = map[v]; 
      let moved = 0; 
      let finalR = boss.r, finalC = boss.c;
      
      // Calculate final position (move up to 3 steps)
      for(let step=0; step<3; step++){ 
        let nr = finalR + dr; 
        let nc = finalC + dc; 
        // Check bounds and reverse direction if needed
        if(!inBounds(nr,nc)){ 
          dr = -dr; 
          dc = -dc; 
          nr = finalR + dr; 
          nc = finalC + dc; 
          if(!inBounds(nr,nc)) break; // Can't move even after reversing
        }
        finalR = nr;
        finalC = nc;
        moved++;
      } 
      
      // Move dragon to final position and handle piece that was there
      if(moved > 0){
        // Save the piece that's currently at the landing square BEFORE we move the dragon there
        const targetId = grid[finalR][finalC];
        
        // Move dragon: clear old position, update dragon position, place in new position
        grid[boss.r][boss.c] = null; 
        boss.r = finalR; 
        boss.c = finalC; 
        
        // If there was a piece at the landing position, remove it from the grid (it will be placed by the player)
        if(targetId && targetId !== boss.id && pieces[targetId]){
          grid[finalR][finalC] = null;  // Clear the displaced piece from the grid
          dragonDisplacingPiece = { targetId, originR: finalR, originC: finalC };
          activeAction = 'dragon-displace';
          const target = pieces[targetId];
          const targetOwner = target.player;
          log(`Dragon displaced ${targetId}! ${targetOwner === 'ally' ? 'Player 1' : 'Player 2'}: click an adjacent empty tile to move ${targetId} to.`);
        }
        
        // Place the Dragon at the final position (after removing the displaced piece if any)
        grid[boss.r][boss.c] = boss.id;
        log(`Dragon moved ${moved} tiles to (${boss.r},${boss.c})`);
      } 
    } else if(v === 5){ 
      boss.currentHp = Math.min(20, boss.currentHp + 3); 
      log('Dragon rested for 3 HP'); 
    } else { 
      const adj = getAdjIds(boss.r,boss.c); 
      adj.forEach(tid => { if(tid && pieces[tid] && pieces[tid].player !== 'boss') applyDamage(boss.id, tid, 3); }); 
      log('Dragon used Firebreath (3 dmg to all adjacent)'); 
    } 
    // Safety check: ensure Dragon still exists before rendering
    if(!pieces[dragonId]){ 
      log('ERROR: Dragon was deleted during bossAct!'); 
    }
    render();
    
    // If there's a pending displacement, highlight adjacent empty tiles AFTER rendering
    if(activeAction === 'dragon-displace'){
      highlightAdjEmpty(pieces[dragonId].r, pieces[dragonId].c);
    } 
  }

  function relocatePiece(id,r,c, prefer){ 
    const piece = pieces[id];
    if(!piece) return null;
    const oldR = piece.r, oldC = piece.c;
    const order=[]; if(prefer) order.push(prefer); order.push([-1,0],[0,1],[0,-1],[1,0],[1,1],[-1,-1],[1,-1],[-1,1]); 
    for(const d of order){ 
      const nr=r+d[0], nc=c+d[1]; 
      if(inBounds(nr,nc) && grid[nr][nc] === null){ 
        grid[oldR][oldC] = null; // Clear old position
        grid[nr][nc] = id; 
        pieces[id].r = nr; 
        pieces[id].c = nc; 
        return {toR:nr,toC:nc}; 
      } 
    } 
    return null; 
  }

  /* ---------- turn flow ---------- */
  btnEndTurn.addEventListener('click', ()=>{
    if(phase === 'setup'){ if(setupPlaced.ally.length !== 3 || setupPlaced.enemy.length !== 3){ log('Both players must place 3 champions to start.'); return; } phase = 'inprogress'; currentStepIndex = 0; currentActor = cycle[currentStepIndex]; log('Game begins. Player 1 (ally) goes first.'); render(); return; }
    
    // Apply pending rest rewards before advancing turn
    for(const id in pendingRestRewards){
      const piece = pieces[id];
      if(piece){
        const reward = pendingRestRewards[id];
        player[piece.player].ap = Math.min(MAX_AP, player[piece.player].ap + reward.ap);
        player[piece.player].hpCurrent = Math.min(player[piece.player].hpTotal, player[piece.player].hpCurrent + reward.hp);
        log(`${id}'s rest completed — owner gained +${reward.ap} AP & +${reward.hp} HP (AP now ${player[piece.player].ap})`);
      }
    }
    pendingRestRewards = {};
    
    // Don't advance the turn yet if Dragon displacement is pending
    if(activeAction === 'dragon-displace'){
      log('Cannot end turn while waiting for player to choose Dragon displacement...');
      return;
    }
    
    currentStepIndex = (currentStepIndex + 1) % cycle.length; currentActor = cycle[currentStepIndex]; log(`Turn advanced to ${currentActor === 'ally' ? 'Player 1' : (currentActor === 'enemy' ? 'Player 2' : 'Dragon')}`);
    if(currentActor === 'ally' || currentActor === 'enemy'){
      const playerKey = currentActor;
      for(const id in pieces){
        const p = pieces[id];
        if(p.player === playerKey){
          p.rested = false;
          p.acted = false;
          // Apply focused state if this ranger was set to focus last turn
          if(focusedRangerId === id && p.champion === 'ranger'){
            p.focused = true;
            log(`${p.id} is focused! Ability ranges are doubled this turn.`);
            focusedRangerId = null;
          } else {
            p.focused = false;
          }
          // Decrement cooldowns (e.g., Bullseye)
          if(p.cooldowns){
            for(const key in p.cooldowns){
              if(p.cooldowns[key] > 0) p.cooldowns[key]--;
            }
          }
          // Remove expired buffs
          if(p.buff && p.buff.turns){
            p.buff.turns--;
            if(p.buff.turns <= 0) p.buff = null;
          }
          log(`${id} is ready for a new turn.`);
        }
      }
    }
    render();
    if(currentActor === 'boss'){
      setTimeout(()=>{
        bossAct();
      }, 450);
    }
  });

  /* ---------- utility / init ---------- */
  function renderInitial(){ emptyGrid(); render(); log('Loaded. Place champions for Player 1 then Player 2.'); finishBtn.disabled = true; }
  renderInitial();

  // helper highlight implementations used above
  function highlightMove(id){ const p = pieces[id]; if(!p) return; const range = (p.move !== undefined) ? p.move : 1; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){ if(grid[r][c] === null && isQueenAccessible(p.r||p.y||0,p.c||p.x||0,r,c,range)){ const el = boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`); if(el) el.classList.add('move'); } } }
  function highlightAdjEnemiesShort(id){ clearHighlights(); const p = pieces[id]; const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]; for(const d of dirs){ const nr=p.r+d[0], nc=p.c+d[1]; if(inBounds(nr,nc) && grid[nr][nc] && pieces[grid[nr][nc]].player !== p.player) boardEl.querySelector(`.cell[data-r="${nr}"][data-c="${nc}"]`).classList.add('attack'); } }

  // expose debug
  window.__av2 = {pieces,grid,player,render};
});
})();
