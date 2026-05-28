class DicePokerBoard extends HTMLElement {
  static faceValue = { 'A': 6, 'K': 5, 'Q': 4, 'J': 3, '8': 2, '7': 1 };

  static get observedAttributes() {
    return ['bestof', 'include-straight', 'status', 'numplayers'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));
    this.roundInfoEl  = this.shadowRoot.querySelector('#round-info');
    this.statusMsgEl  = this.shadowRoot.querySelector('#status-msg');
    this.waitingEl    = this.shadowRoot.querySelector('#waiting');
    this.waitingMsgEl = this.shadowRoot.querySelector('#waiting-msg');
    this.timerEl      = this.shadowRoot.querySelector('#timer');
    this.started = false;
    this._timerInterval = null;
  }

  connectedCallback() {
    this.totalRounds = parseInt(this.getAttribute('bestof')) || 3;
    this.setEventListeners();
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === 'bestof') this.totalRounds = parseInt(newValue) || 3;
  }

  setEventListeners() {
    const slot = this.shadowRoot.querySelector('slot');
    slot.addEventListener('slotchange', () => {
      this.players = slot.assignedElements();
      const needed = parseInt(this.getAttribute('numplayers')) || 2;

      // Not enough players yet — show waiting screen
      if (this.players.length < needed) {
        this._showWaiting(this.players.length, needed);
        return;
      }

      this._hideWaiting();
      this.scores = Array(this.players.length).fill(0);
      this.players.forEach(player => {
        player.addEventListener('player-turn-finished', (e) => {
          this.turnFinished(e.detail.faces, e.detail.name);
        });
      });

      if (!this.started && this.getAttribute('status') !== 'finished') {
        this.started = true;
        this.gameStart();
      }
    });
  }

  _showWaiting(current, needed) {
    this.waitingEl.style.display = 'flex';
    this.waitingMsgEl.textContent = `Waiting for players… ${current} / ${needed} joined`;
  }

  _hideWaiting() {
    this.waitingEl.style.display = 'none';
  }

  _updateRoundInfo() {
    if (this.roundInfoEl) {
      this.roundInfoEl.textContent = `Round ${this.round} of ${this.totalRounds}`;
    }
  }

  _setStatus(msg) {
    if (this.statusMsgEl) this.statusMsgEl.textContent = msg;
  }

  _startTimer(seconds) {
    this._clearTimer();
    let timeLeft = seconds;
    this._updateTimer(timeLeft);
    this._timerInterval = setInterval(() => {
      timeLeft--;
      this._updateTimer(timeLeft);
      if (timeLeft <= 0) {
        this._clearTimer();
        const current = this.players[this.currentPlayerIndex];
        if (current.rollCount === 0) current.rollDice();
        setTimeout(() => current.finishTurn(), 300);
      }
    }, 1000);
  }

  _clearTimer() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
    if (this.timerEl) { this.timerEl.textContent = ''; this.timerEl.className = 'timer'; }
  }

  _updateTimer(seconds) {
    if (!this.timerEl) return;
    this.timerEl.textContent = `⏱ ${seconds}s`;
    this.timerEl.className = seconds <= 5 ? 'timer urgent' : 'timer';
  }

  // Called from GamePage when the local player clicks "Leave Game"
  handlePlayerLeave(userId) {
    if (!this.players) return;
    const player = this.players.find(p => p.getAttribute('userid') === String(userId));
    if (!player) return;
    player.setAttribute('auto', '');
    // If it's currently their turn, auto-finish it now
    if (this.players[this.currentPlayerIndex] === player) {
      this._clearTimer();
      if (player.rollCount === 0) player.rollDice();
      setTimeout(() => player.finishTurn(), 300);
    }
  }

  gameStart() {
    this.round = 1;
    this.currentPlayerIndex = 0;
    this.results = [];
    this._updateRoundInfo();
    this._setStatus('');
    this.dispatchEvent(new CustomEvent('game-start', {
      bubbles: true,
      composed: true,
      detail: {
        players: this.players.map(p => p.getAttribute('playername')),
        bestOf: this.totalRounds
      }
    }));
    this.turn();
  }

  turn() {
    this._clearTimer();
    this._updateRoundInfo();
    this.players.forEach((p, i) => {
      if (i === this.currentPlayerIndex) p.setAttribute('active', '');
      else p.removeAttribute('active');
    });
    this.players.forEach(p => {
      if (!p.hasAttribute('local')) p.hideDice();
    });
    this.players.forEach((p, i) => {
      if (i === this.currentPlayerIndex) p.startTurn();
      else p.disablePlayer();
    });
    const current = this.players[this.currentPlayerIndex];
    current.rollDice();
    // Auto-play for players who left
    if (current.hasAttribute('auto')) {
      setTimeout(() => current.finishTurn(), 600);
      return;
    }
    const roundTime = parseInt(this.getAttribute('roundtime')) || 30;
    this._startTimer(roundTime);
  }

  turnFinished(faces, name) {
    this._clearTimer();
    this.results[this.currentPlayerIndex] = faces;
    this.dispatchEvent(new CustomEvent('turn-finish', {
      bubbles: true,
      composed: true,
      detail: { faces, name }
    }));
    if (this.currentPlayerIndex < this.players.length - 1) {
      this.currentPlayerIndex++;
      this.turn();
      return;
    }
    // All players done — reveal dice then compare
    this.players.forEach(p => p.revealDice());
    this.compareTurns();
  }

  static handRules = [
    {
      name: 'Repóker', rank: 7,
      matches: ({ counts }) => counts[0] === 5,
      tiebreaker: ({ uniqueValues }) => [uniqueValues[0]]
    },
    {
      name: 'Póker', rank: 6,
      matches: ({ counts }) => counts[0] === 4,
      tiebreaker: ({ freq, uniqueValues }) => {
        return [uniqueValues.find(v => freq[v] === 4), uniqueValues.find(v => freq[v] === 1)];
      }
    },
    {
      name: 'Full House', rank: 5,
      matches: ({ counts }) => counts[0] === 3 && counts[1] === 2,
      tiebreaker: ({ freq, uniqueValues }) => {
        return [uniqueValues.find(v => freq[v] === 3), uniqueValues.find(v => freq[v] === 2)];
      }
    },
    {
      name: 'Straight', rank: 4,
      matches: ({ isStraight }) => isStraight,
      tiebreaker: ({ uniqueValues }) => [uniqueValues[0]]
    },
    {
      name: 'Trío', rank: 3,
      matches: ({ counts }) => counts[0] === 3,
      tiebreaker: ({ freq, uniqueValues }) => {
        return [uniqueValues.find(v => freq[v] === 3), ...uniqueValues.filter(v => freq[v] === 1)];
      }
    },
    {
      name: 'Doble Pareja', rank: 2,
      matches: ({ counts }) => counts[0] === 2 && counts[1] === 2,
      tiebreaker: ({ freq, uniqueValues }) => {
        return [...uniqueValues.filter(v => freq[v] === 2), uniqueValues.find(v => freq[v] === 1)];
      }
    },
    {
      name: 'Pareja', rank: 1,
      matches: ({ counts }) => counts[0] === 2,
      tiebreaker: ({ freq, uniqueValues }) => {
        return [uniqueValues.find(v => freq[v] === 2), ...uniqueValues.filter(v => freq[v] === 1)];
      }
    },
    {
      name: 'Carta Alta', rank: 0,
      matches: () => true,
      tiebreaker: ({ uniqueValues }) => [...uniqueValues]
    }
  ];

  #evaluateHand(faces) {
    const values = faces.map(f => DicePokerBoard.faceValue[f]);
    const sorted = values.slice().sort((a, b) => a - b);
    const freq = {};
    for (const x of sorted) freq[x] = (freq[x] || 0) + 1;
    const counts = Object.values(freq).sort((a, b) => b - a);
    const uniqueValues = Object.keys(freq).map(Number).sort((a, b) => b - a);
    const includeStraight = this.hasAttribute('include-straight');
    const isStraight = includeStraight && sorted.every((v, i, arr) => i === 0 || v === arr[i - 1] + 1);
    const context = { sorted, freq, counts, uniqueValues, isStraight };
    for (const rule of DicePokerBoard.handRules) {
      if (rule.matches(context)) {
        return { faces, values: sorted, rank: rule.rank, name: rule.name, tiebreaker: rule.tiebreaker(context) };
      }
    }
  }

  compareTurns() {
    const evaluated = this.results.map(faces => this.#evaluateHand(faces));
    evaluated.sort((a, b) => {
      if (a.rank !== b.rank) return b.rank - a.rank;
      for (let i = 0; i < a.tiebreaker.length; i++) {
        if (a.tiebreaker[i] !== b.tiebreaker[i]) return b.tiebreaker[i] - a.tiebreaker[i];
      }
      return 0;
    });
    const winner = evaluated[0];
    const winnerIndex = this.results.findIndex(faces => faces === winner.faces);
    this.roundEnd({ winnerIndex, winner, evaluated });
  }

  roundEnd({ winnerIndex, winner, evaluated }) {
    this.scores[winnerIndex]++;
    this.players.forEach((p, i) => p.setAttribute('score', this.scores[i]));
    this.players.forEach((p, i) => {
      if (i === winnerIndex) p.setAttribute('winner', '');
      else p.removeAttribute('winner');
    });

    const winnerName = this.players[winnerIndex].getAttribute('playername');
    this._setStatus(`${winnerName} wins the round with ${winner.name}!`);

    this.dispatchEvent(new CustomEvent('round-finish', {
      bubbles: true,
      composed: true,
      detail: { round: this.round, name: winnerName, hand: winner.name, evaluated }
    }));

    const winningScore = Math.floor(this.totalRounds / 2) + 1;
    if (this.scores[winnerIndex] >= winningScore) {
      this.finishGame();
      return;
    }

    // Wait 2s so players can see the revealed dice, then start the next round
    setTimeout(() => {
      this.currentPlayerIndex = 0;
      this.results = [];
      this.round++;
      this._setStatus('');
      this.players.forEach(p => p.removeAttribute('winner'));
      this.turn();
    }, 2000);
  }

  finishGame() {
    const winningScore = Math.ceil(this.totalRounds / 2);
    const winnerIndex = this.scores.findIndex(s => s >= winningScore);
    const winnerName = winnerIndex !== -1
      ? this.players[winnerIndex].getAttribute('playername')
      : 'Nobody';

    if (winnerIndex !== -1) {
      this.setAttribute('winner', `player${winnerIndex + 1}`);
      this.players[winnerIndex].classList.add('highlight');
    } else {
      this.setAttribute('winner', 'draw');
    }

    this.players.forEach(p => {
      p.disablePlayer();
      p.removeAttribute('active');
    });

    this._setStatus(`🏆 ${winnerName} wins the match!`);

    this.dispatchEvent(new CustomEvent('game-ended', {
      bubbles: true,
      composed: true,
      detail: { name: winnerName, scores: [...this.scores], score: this.scores[winnerIndex] }
    }));
  }

  resetGame() {
    this.round = 1;
    this.currentPlayerIndex = 0;
    this.results = [];
    this.scores = Array(this.players.length).fill(0);
    this.players.forEach(p => {
      p.removeAttribute('winner');
      p.setAttribute('score', '0');
      p.removeAttribute('active');
      p.disablePlayer();
      p.classList.remove('highlight');
    });
    this.removeAttribute('winner');
    this._setStatus('');
    this.gameStart();
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
        color: white;
        padding: 4px 4px 12px;
        font-size: 0.95rem;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      #round-info {
        font-weight: 700;
        font-size: 1rem;
        letter-spacing: 0.03em;
        color: #6FD86F;
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
        background: rgba(0,0,0,0.4);
        border: 1px solid #3D8A3A;
        min-width: 56px;
        text-align: center;
        color: #6FD86F;
      }
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0.35; }
      }
      .timer.urgent {
        color: #FF6B6B;
        border-color: #FF6B6B;
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
        color: #6FD86F;
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
