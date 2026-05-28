class DicePokerPlayer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));
    this.rollButton    = this.shadowRoot.getElementById('roll');
    this.holdButton    = this.shadowRoot.getElementById('hold');
    this.continueButton = this.shadowRoot.getElementById('continue');
    this.dice = [...this.shadowRoot.querySelectorAll('dice-poker-die')];
    this.playerName = this.getAttribute('playername') || 'Unknown';
    this.score      = this.getAttribute('score') || 0;
    this.rollCount  = 0;
    this._holdMode = false;
  }

  static get observedAttributes() {
    return ['local', 'playername'];
  }

  connectedCallback() {
    // Re-read name here because React sets attributes after the constructor runs
    this.playerName = this.getAttribute('playername') || 'Unknown';
    this._renderHeader(this._score, null);
    this._wireButtons();
    this._wireHolds();
    this.disableControls();
    // Opponents start with hidden dice — local player's dice are always visible
    if (!this.hasAttribute('local')) this.hideDice();
  }

  attributeChangedCallback(name, _old, val){
    if (name === 'playername') {this.playerName = val || 'Unknown'; this._renderHeader(this._score, null); }
  }

  _renderHeader(score, rollsLeft){
    this._score = score ?? 0;
    this.shadowRoot.querySelector('#name').textContent = this.playerName;
    this.shadowRoot.querySelector('#wins').textContent = `Score: ${this._score}`;
    const rollsEl = this.shadowRoot.querySelector('#rolls');
    rollsEl.textContent = this.hasAttribute('local') && rollsLeft != null ? `Rolls left: ${rollsLeft}` : '';
  }
  _wireButtons(){
    this.rollButton.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('request-roll', {
        bubbles: true, composed: true,
        detail: { userid: this.getAttribute('userid'), held: this.getHeld() }
      }));
    });
    this.continueButton.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('request-done', {
      bubbles: true, composed: true,
      detail: {userid: this.getAttribute('userid')}
    }));
    });
    this.holdButton.addEventListener('click', () => {
      this._holdMode = !this._holdMode;
      this.holdButton.textContent = this._holdMode ? 'Holding' : 'Hold';
    });


  }
  _wireHolds(){
    this.dice.forEach(die => {
      die.addEventListener('click', () => {
        if (!this._holdMode || this.rollButton.disabled) return;
        die.toggleAttribute('onhold');
      })

    })
  }


  getHeld() {
    return this.dice 
      .map((die, i) => (die.hasAttribute('onhold') ? i : -1))
      .filter(i => i >= 0);
  }

  applyPlayer({ faces, score, active, yourTurn, rollsLeft }) {
    this._renderHeader(score, yourTurn ? rollsLeft: null);
    if (active) this.setAttribute('active', ''); else this.removeAttribute('active');

    const isNewRound = !(faces ?? []).some(f => f !== null);
    if (isNewRound) {
        this._holdMode = false;
        this.holdButton.textContent = 'Hold';
        this.dice.forEach(d => d.removeAttribute('onhold'));
    }

    this.dice.forEach((die, i) => {
        const face = faces?.[i] ?? null;
        if (face === null) {
            die.setAttribute('hidden-face', '');
        } else {
            die.removeAttribute('hidden-face');
            die.setFace(face);
        }
    });


    if (yourTurn) {
      const hasRolled = (faces ?? []).some(f => f !== null);
      this.rollButton.disabled = rollsLeft <= 0;
      this.continueButton.disabled = !hasRolled;
      this.holdButton.disabled = !hasRolled || rollsLeft <= 0;
    } else {
      this.disableControls();
    }
  }

  disableControls(){
    this.rollButton.disabled = true;
    this.holdButton.disabled = true;
    this.continueButton.disabled = true
  }
  hideDice() {this.dice.forEach(d => d.setAttribute('hidden-face', '')); }
  revealDice() {this.dice.forEach(d => d.removeAttribute('hidden-face')); }

  _getTemplate() {
    const template = document.createElement('template');
    template.innerHTML = `
    <style>
      @keyframes click-pop {
        0%   { transform: scale(1); }
        50%  { transform: scale(0.93); }
        100% { transform: scale(1); }
      }
      @keyframes pulse {
        0%   { box-shadow: 0 0 6px 3px rgba(255,215,0,0.6); }
        50%  { box-shadow: 0 0 18px 10px rgba(255,215,0,0.9); }
        100% { box-shadow: 0 0 6px 3px rgba(255,215,0,0.6); }
      }
      :host {
        display: block;
        padding: 12px;
        background: var(--theme-background-alt, #162816);
        border: 1px solid var(--theme-accent-dark, #3D8A3A);
        border-radius: 20px;
        min-width: 260px;
      }
      :host([active]) {
        border-color: gold;
      }
      :host(.highlight) {
        animation: pulse 2s ease-in-out infinite;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
        color: var(--theme-text, white);
      }
      #name {
        font-size: 1rem;
        font-weight: 700;
        color: var(--theme-accent-light, #6FD86F);
      }
      #wins {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--theme-accent, gold);
      }
      #rolls {
        font-size: 0.8rem;
        color: var(--theme-text-secondary, rgba(255,255,255,0.55));
        margin: 4px 0 8px;
        min-height: 1.1em;
      }
      .dice-container {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: center;
        margin-bottom: 10px;
      }
      .button-container {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
      }
      button {
        flex: 1;
        padding: 8px 4px;
        font-size: 0.85rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: opacity 0.15s, transform 0.1s;
      }
      button:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
      button:not(:disabled):active {
        animation: click-pop 0.2s ease-out;
      }
      button:not(:disabled):hover {
        opacity: 0.85;
        transform: translateY(-1px);
      }
      #roll     { background: var(--theme-accent, #5CB856); color: var(--theme-text-inverse, white); }
      #hold     { background: var(--die-held-color); color: #111; }
      #continue { background: var(--theme-primary, #1a3a1a); color: var(--theme-accent-light, #6FD86F); border: 1px solid var(--theme-accent-dark, #3D8A3A); }
    </style>
    <div part="player">
      <div class="header">
        <span id="name"></span>
        <span id="wins">Score: 0</span>
      </div>
      <p id="rolls"></p>
      <div class="dice-container">
        <dice-poker-die face=""></dice-poker-die>
        <dice-poker-die face=""></dice-poker-die>
        <dice-poker-die face=""></dice-poker-die>
        <dice-poker-die face=""></dice-poker-die>
        <dice-poker-die face=""></dice-poker-die>
      </div>
      <div class="button-container">
        <button id="roll">Roll</button>
        <button id="hold">Hold</button>
        <button id="continue">Done</button>
      </div>
    </div>`;
    return template;
  }
}

if (!customElements.get('dice-poker-player')) {
    customElements.define('dice-poker-player', DicePokerPlayer);
}
