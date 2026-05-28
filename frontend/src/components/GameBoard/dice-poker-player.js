class DicePokerPlayer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));
    this.rollButton    = this.shadowRoot.getElementById('roll');
    this.holdButton    = this.shadowRoot.getElementById('hold');
    this.continueButton = this.shadowRoot.getElementById('continue');
    this.playerName = this.getAttribute('playername') || 'Unknown';
    this.score      = this.getAttribute('score') || 0;
    this.rollCount  = 0;
  }

  static get observedAttributes() {
    return ['active', 'score', 'local', 'winner', 'playername'];
  }

  connectedCallback() {
    // Re-read name here because React sets attributes after the constructor runs
    this.playerName = this.getAttribute('playername') || 'Unknown';
    this.render();
    this.setEventListeners();
    this.rollButton.disabled    = true;
    this.holdButton.disabled    = true;
    this.continueButton.disabled = true;
    // Opponents start with hidden dice — local player's dice are always visible
    if (!this.hasAttribute('local')) this.hideDice();
  }

  render() {
    this.shadowRoot.querySelector('#name').textContent = this.playerName;
    this.shadowRoot.querySelector('#wins').textContent = `Score: ${this.score}`;
    // Only show roll counter for the local player
    const rollsEl = this.shadowRoot.querySelector('#rolls');
    rollsEl.textContent = this.hasAttribute('local')
      ? `Rolls left: ${3 - this.rollCount}`
      : '';
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === 'score') { this.score = newValue; this.render(); }
    if (name === 'playername') { this.playerName = newValue || 'Unknown'; this.render(); }
  }

  setEventListeners() {
    this.rollButton.addEventListener('click', () => this.rollDice());
    this.holdButton.addEventListener('click', () => this.holdDice());
    this.continueButton.addEventListener('click', () => this.finishTurn());

    // Register die-click listeners once — only toggle hold when hold button is active
    this.shadowRoot.querySelectorAll('dice-poker-die').forEach(die => {
      die.addEventListener('click', () => {
        if (this.holdButton.disabled) return;
        if (!die.hasAttribute('onhold')) {
          die.setAttribute('onhold', '');
        } else {
          die.removeAttribute('onhold');
        }
      });
    });
  }

  startTurn() {
    this.rollButton.disabled    = false;
    this.holdButton.disabled    = true;
    this.continueButton.disabled = true;
    this.rollCount = 0;
    this.render();
    // Clear any holds from the previous round
    this.shadowRoot.querySelectorAll('dice-poker-die').forEach(die => {
      die.removeAttribute('onhold');
    });
  }

  rollDice() {
    this.rollCount++;
    const maxRolls = 3;
    if (this.rollCount >= maxRolls) {
      this.rollButton.disabled = true;
      this.holdButton.disabled = true;
    }
    if (this.rollCount === 1) {
      this.holdButton.disabled    = false;
      this.continueButton.disabled = false;
    }
    this.shadowRoot.querySelectorAll('dice-poker-die').forEach(die => {
      if (!die.hasAttribute('onhold')) die.diceRoll();
    });
    this.render();
    this.dispatchEvent(new CustomEvent('player-roll', {
      bubbles: true,
      composed: true,
      detail: { faces: this.getFaces(), name: this.playerName, rollsLeft: maxRolls - this.rollCount }
    }));
  }

  holdDice() {
    this.dispatchEvent(new CustomEvent('player-hold', {
      bubbles: true,
      composed: true,
      detail: { name: this.playerName }
    }));
  }

  disablePlayer() {
    this.rollButton.disabled    = true;
    this.holdButton.disabled    = true;
    this.continueButton.disabled = true;
  }

  getFaces() {
    return [...this.shadowRoot.querySelectorAll('dice-poker-die')].map(d => d.getAttribute('face'));
  }

  finishTurn() {
    const faces = this.getFaces();
    this.rollCount = 0;
    this.render();
    this.shadowRoot.querySelectorAll('dice-poker-die').forEach(die => {
      die.removeAttribute('onhold');
    });
    this.dispatchEvent(new CustomEvent('player-turn-finished', {
      bubbles: true,
      composed: true,
      detail: { faces, name: this.playerName }
    }));
  }

  receiveFaces(faces) {
    const dice = this.shadowRoot.querySelectorAll('dice-poker-die');
    dice.forEach((die, i) => { if (faces[i] !== undefined) die.setFace(faces[i]); });
    this.render();
  }

  revealDice() {
    this.shadowRoot.querySelectorAll('dice-poker-die').forEach(die => die.removeAttribute('hidden-face'));
  }

  hideDice() {
    this.shadowRoot.querySelectorAll('dice-poker-die').forEach(die => die.setAttribute('hidden-face', ''));
  }

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
