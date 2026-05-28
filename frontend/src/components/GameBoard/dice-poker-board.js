class DicePokerBoard extends HTMLElement {

  static get observedAttributes() {
    return ['bestof'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));
    this.roundInfoEl  = this.shadowRoot.querySelector('#round-info');
    this.statusMsgEl  = this.shadowRoot.querySelector('#status-msg');
    this.waitingEl    = this.shadowRoot.querySelector('#waiting');
    this.waitingMsgEl = this.shadowRoot.querySelector('#waiting-msg');
    this.totalRounds = 3;
    this.timerEl = this.shadowRoot.querySelector('#timer');
    this._timerInterval = null;
    this._lastToAct = null;
  }

  connectedCallback() {
    this.totalRounds = parseInt(this.getAttribute('bestof')) || 3;
  }

  attributeChangedCallback(name, _old, val) {
    if (name === 'bestof') this.totalRounds = parseInt(val) || 3;
  }

  _showWaiting(msg = 'Waiting for players...') {
    this.waitingEl.style.display = 'flex';
    this.waitingMsgEl.textContent = msg;
  }

  _hideWaiting(){
    this.waitingEl.style.display = 'none';
  }

  _startTimer(seconds, isMyTurn) {
    clearInterval(this._timerInterval);
    let remaining = seconds;
    this._tick(remaining);
    this._timerInterval = setInterval(() => {
      remaining -= 1;
      this._tick(remaining);
      if (remaining <= 0) {
        clearInterval(this._timerInterval);
        if (isMyTurn) this._autoFinish();
      }
    }, 1000);
  }

  _tick(remaining) {
    if (!this.timerEl) return;
    this.timerEl.textContent = `${Math.max(remaining, 0)}s`;
    this.timerEl.classList.toggle('urgent', remaining <= 10)
  }

  _stopTimer(){
    clearInterval(this._timerInterval);
    if (this.timerEl) { this.timerEl.textContent = ''; this.timerEl.classList.remove('urgent'); }
  }

  _autoFinish() {
    const localEl = this.querySelector('dice-poker-player[local]');
    const needsRoll = localEl?.continueButton?.disabled ?? true;
    if (needsRoll) {
      this.dispatchEvent(new CustomEvent('request-roll', { bubbles: true, detail: { held: [] } }));
      setTimeout(() => {
        this.dispatchEvent(new CustomEvent('request-done', { bubbles: true, composed: true }));
      }, 600);
    } else {
      this.dispatchEvent(new CustomEvent('request-done', { bubbles: true, composed: true }));
    }
  }

  showRoundResult(winnerIds, handNames) {
    const ids = (winnerIds ?? []).map(String);
    const playerEls = [...this.querySelectorAll('dice-poker-player')];
    const names = playerEls
        .filter(el => ids.includes(el.getAttribute('userid')))
        .map(el => el.getAttribute('playername'));
    const hand = handNames?.[winnerIds?.[0]] ?? '';
    if (this.statusMsgEl) {
        this.statusMsgEl.textContent = names.length
            ? `${names.join(' & ')} wins${hand ? ` — ${hand}` : ''}!`
            : '';
    }
  }


  showGameOver(winnerIds) {
    this._stopTimer();
    const ids = (winnerIds ?? []).map(String);
    const playerEls = [...this.querySelectorAll('dice-poker-player')];
    const names = playerEls
      .filter(el => ids.includes(el.getAttribute('userid')))
      .map(el => el.getAttribute('playername'));
    if (this.roundInfoEl) this.roundInfoEl.textContent = 'Game Over';
    if (this.statusMsgEl) {
      this.statusMsgEl.textContent = names.length ? `${names.join(' & ')} wins!` : 'Game Over!';
    }
  }

  applyState(state, viewerId){
    if (!state) return;

    if (state.status === 'waiting'){
      this._showWaiting();
      return;
    }
    this._hideWaiting();

    const roundtime = parseInt(this.getAttribute('roundtime')) || 30;
    if (state.phase === 'finished') {
      this._stopTimer();
    } else if (state.toAct !== this._lastToAct) {
      if (state.toAct) this._startTimer(roundtime, state.toAct === viewerId);
      else this._stopTimer();
    }
    this._lastToAct = state.toAct;
  
    if(this.roundInfoEl){
      this.roundInfoEl.textContent = `Round ${state.currentRound} of ${this.totalRounds}`;
    }

    const playerEls = this.querySelectorAll('dice-poker-player');
    playerEls.forEach(el => {
      const p = state.players.find(pl => String(pl.userId) === el.getAttribute('userid'));
      if (!p) return;
      const isViewer = p.userId === viewerId;
      el.applyPlayer({
        faces: p.faces,
        score: p.score,
        active: state.toAct === p.userId,                 
        yourTurn: isViewer && state.toAct === p.userId,  
        rollsLeft: p.rollsLeft
      });
    });
    if (this.statusMsgEl){
      if (state.phase === 'finished') {
        this.statusMsgEl.textContent = 'Game Over!';
      } else {
        const current = state.players.find(pl => pl.userId === state.toAct);
        this.statusMsgEl.textContent = current ? `${current.username}'s turn` : '';
      }
    }
  }


  _getTemplate() {
    const template = document.createElement('template');
    template.innerHTML = `
    <style>
      @keyframes pulse {
        0%   { box-shadow: 0 0 6px 3px rgba(92,184,86,0.5); }
        50%  { box-shadow: 0 0 14px 8px rgba(92,184,86,0.8); }
        100% { box-shadow: 0 0 6px 3px rgba(92,184,86,0.5); }
      }
      .board-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: var(--theme-text, white);
        padding: 4px 4px 12px;
        font-size: 0.95rem;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      #round-info {
        font-weight: 700;
        font-size: 1rem;
        letter-spacing: 0.03em;
        color: var(--theme-text, white);
      }
      #status-msg {
        font-style: italic;
        color: gold;
        font-size: 0.9rem;
        text-align: center;
        flex: 1;
      }
      .timer {
        font-weight: 700;
        font-size: 1rem;
        padding: 3px 12px;
        border-radius: 6px;
        background: rgba(0,0,0,0.3);
        border: 1px solid var(--theme-accent-dark, #3D8A3A);
        min-width: 56px;
        text-align: center;
        color: var(--theme-text, #6FD86F);
      }
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0.35; }
      }
      .timer.urgent {
        color: var(--theme-danger, #FF6B6B);
        border-color: var(--theme-danger, #FF6B6B);
        animation: blink 0.5s ease-in-out infinite;
      }
      .flex {
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        justify-content: space-around;
        gap: 1.5rem;
      }
      #waiting {
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--theme-text, #6FD86F);
        padding: 2rem;
        gap: 0.5rem;
      }
      #waiting-msg {
        font-size: 1.1rem;
        opacity: 0.85;
      }
      .highlight {
        animation: pulse 2s ease-in-out infinite;
        border-radius: 6px;
      }
      slot { display: contents; }
    </style>
    <div class="board-header">
      <span id="round-info"></span>
      <span id="status-msg"></span>
      <span id="timer" class="timer"></span>
    </div>
    <div id="waiting">
      <p id="waiting-msg"></p>
    </div>
    <div class="flex">
      <slot></slot>
    </div>`;
    return template;
  }
}

if (!customElements.get('dice-poker-board')) {
    customElements.define('dice-poker-board', DicePokerBoard);
}
