class DicePokerBoard extends HTMLElement {
  static faceValue = {'A': 6,'K': 5,'Q': 4,'J': 3,'8': 2,'7': 1};
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const template = this._getTemplate();
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.boBtn = this.shadowRoot.querySelector('#bestof');
    this.totalRounds = this.getAttribute('bestof');
    this.straight = this.getAttribute('include-straight');
    this.straightBtn = this.shadowRoot.querySelector('#straight');
    this.startButton = this.shadowRoot.querySelector('#start-game');
    this.newGameBtn = this.shadowRoot.querySelector('#new-game');
    this.newGameBtn.style.display = "none";

  }
  
  connectedCallback() {
    this.setEventListeners();
  }
  setEventListeners(){
    const slot = this.shadowRoot.querySelector('slot');
    slot.addEventListener('slotchange', () => {
    this.players = slot.assignedElements();
    this.scores = Array(this.players.length).fill(0);
    this.players.forEach(player => {
      player.addEventListener('player-turn-finished', (e) => {
        console.log("Player finished:", e.detail.name, e.detail.faces);
        this.turnFinished(e.detail.faces, e.detail.name);
      });
    });
   
    this.newGameBtn.addEventListener('click', () => this.resetGame());
  });
    
    this.startButton.addEventListener('click',()=> this.applyGameRules());
    this.startButton.classList.add('highlight');
  }
  
  applyGameRules(){
  const setBestOf = parseInt(this.boBtn.value, 10);

  this.toggleAttribute('include-straight', this.straightBtn.checked);

  this.setAttribute('bestof', setBestOf);
  this.totalRounds = setBestOf;
  this.startButton.disabled = true;
  this.startButton.style.display = "none";

  this.gameStart();

  }
  gameStart() {
  this.round = 1;
  this.currentPlayerIndex = 0;
  // Clearing any results of previous games
  this.results = [];
  this.newGameBtn.style.display = "block";
  this.dispatchEvent(new CustomEvent("game-start",{
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
  const current = this.players[this.currentPlayerIndex];

  // Highlight active player
  this.players.forEach((p, i) => {
    if (i === this.currentPlayerIndex) p.setAttribute('active', '');
    else p.removeAttribute('active');
  });

  // Enable only the active player
  this.players.forEach((p, i) => {
    if (i === this.currentPlayerIndex) p.startTurn();
    else p.disablePlayer();
  });

  // Telling Current player to Auto roll 
  current.rollDice();
  }

  turnFinished(faces, name) {
  this.results[this.currentPlayerIndex] = faces;
  this.dispatchEvent(new CustomEvent("turn-finish",{
  bubbles: true,
  composed: true,
  detail: {
    faces: faces,
    name: name
  }
  }));
  // If there are more players left in this round
  if (this.currentPlayerIndex < this.players.length - 1) {
    this.currentPlayerIndex++;
    this.turn();
    return;
  }
  

  this.compareTurns();
  }
  // Game Logic
  static handRules = [
  {
    name: "Repóker",
    rank: 7,
    matches: ({ counts }) => counts[0] === 5,
    tiebreaker: ({ uniqueValues }) => [uniqueValues[0]]
  },
  {
  name: "Póker",
  rank: 6,
  matches: ({ counts }) => counts[0] === 4,
  tiebreaker: ({ freq, uniqueValues }) => {
    const quad = uniqueValues.find(v => freq[v] === 4);
    const kicker = uniqueValues.find(v => freq[v] === 1);
    return [quad, kicker];
  }
  },
  {
    name: "Full House",
    rank: 5,
    matches: ({ counts }) => counts[0] === 3 && counts[1] === 2,
    tiebreaker: ({ freq, uniqueValues }) => {
    const triple = uniqueValues.find(v => freq[v] === 3);
    const pair = uniqueValues.find(v => freq[v] === 2);
    return [triple, pair];
  }
  },
  {
    name: "Straight",
    rank: 4,
    matches: ({isStraight})=> isStraight,
    tiebreaker: ({ uniqueValues }) => [uniqueValues[0]]
  },
  {
    name: "Trío",
    rank: 3,
    matches: ({ counts }) => counts[0] === 3,
    tiebreaker: ({ freq, uniqueValues }) => {
    const triple = uniqueValues.find(v => freq[v] === 3);
    // Unique values for tiebreaker logic
    const kickers = uniqueValues.filter(v => freq[v] === 1);
    return [triple, ...kickers];
  }
  },
  {
    name: "Doble Pareja",
    rank: 2,
    matches: ({ counts }) => counts[0] === 2 && counts[1] === 2,
    tiebreaker: ({ freq, uniqueValues }) => {
    const pairs = uniqueValues.filter(v => freq[v] === 2);
    const kicker = uniqueValues.find(v => freq[v] === 1);
    return [...pairs, kicker];
  }
  },
  {
   name: "Pareja",
    rank: 1,
    matches: ({ counts }) => counts[0] === 2,
    tiebreaker: ({ freq, uniqueValues }) => {
    const pair = uniqueValues.find(v => freq[v] === 2);
    const kickers = uniqueValues.filter(v => freq[v] === 1);
    return [pair, ...kickers];
    }
  },
  {
    name: "Carta Alta",
    rank: 0,
    // Using it as a fallback option instead of manual matching since other rules cover that basis
    matches: ()=>true,
    tiebreaker: ({uniqueValues})=>[...uniqueValues]
  }
];

  #evaluateHand(faces){
    // Take faces from player map them with values to give number based game logic
    const values = faces.map(f => DicePokerBoard.faceValue[f]);
    // Sort by highest to make tiebreakers and matching game rules easier
    const sorted = values.slice().sort((a, b) => a - b);
    const freq = {};
    for (const x of sorted) {
      // Fallback default 0 so JS knows to increment when a number is read
    freq[x] = (freq[x] || 0) + 1;
    }
    // Count the amount of similar values sort by the most i.e triple over double
    const counts = Object.values(freq).sort((a, b) => b - a);
    // Take unique values for tiebreaker / kicker logic
    const uniqueValues = Object.keys(freq).map(Number).sort((a, b) => b - a);
    const includeStraight = this.hasAttribute("include-straight");
    const isStraight = includeStraight && sorted.every((v, i, arr) => i === 0 || v === arr[i - 1] + 1);
    // Context to match up towards game rules to see what the hand is and the parameters needed to gain a valid hand
    const context = {
    sorted,
    freq,
    counts,
    uniqueValues,
    isStraight
    };
    // Loop through game logic see if it matches a rule
    for (const rule of DicePokerBoard.handRules) {
    if (rule.matches(context)) {
      // Return matched rule rank and tiebreaker with the faces and values
      return {
        faces,
        values: sorted,
        rank: rule.rank,
        name: rule.name,
        // Use context object to later compare what secondary values wins over a similar hand
        tiebreaker: rule.tiebreaker(context)
      };
    }
    }

  }
  compareTurns() {
  // Getting results and parsing them through the evaluateHand function
  const evaluated = this.results.map(faces => this.#evaluateHand(faces));

  // Sort players by rank then tiebreaker
  evaluated.sort((a, b) => {
    // Compare rank first
    if (a.rank !== b.rank) {
      return b.rank - a.rank; // higher rank wins
    }

    // If ranks tie compare tiebreaker arrays
    for (let i = 0; i < a.tiebreaker.length; i++) {
      if (a.tiebreaker[i] !== b.tiebreaker[i]) {
        return b.tiebreaker[i] - a.tiebreaker[i];
      }
    }
    return 0; // exact tie
  });

  // Winner is the first after sorting
  const winner = evaluated[0];
  console.log(winner);
  // Find which player index this winner belongs to
  const winnerIndex = this.results.findIndex(
    faces => faces === winner.faces
  );

   // End the game
  this.roundEnd({
    winnerIndex,
    winner,
    evaluated
  });
}

 roundEnd({ winnerIndex, winner, evaluated }) {
  this.scores[winnerIndex]++;

  // Update score attributes on players
  this.players.forEach((p, i) => {
    p.setAttribute("score", this.scores[i]);
  });

  // Log winner
  console.log(
    `Player ${winnerIndex + 1} (${this.players[winnerIndex].getAttribute('playername')}) wins round ${this.round} with ${winner.name} [${winner.tiebreaker.join(', ')}]`
  );

  // Highlight winner
  this.players.forEach((p, i) => {
    if (i === winnerIndex) p.setAttribute('winner', '');
    else p.removeAttribute('winner');
  });
  this.dispatchEvent(new CustomEvent("round-finish",{
    bubbles: true,
    composed: true,
    detail: {
      round: this.round,
      winner: this.players[winnerIndex],
      name: this.players[winnerIndex].getAttribute('playername'),
      hand: winner.name
    }
  }));

  // Grab winning score and end loop if winning score is reached
  const winningScore = Math.floor(this.totalRounds / 2) + 1;
  console.log("The winning score is", winningScore);
  if (this.scores[winnerIndex] >= winningScore) {
      this.finishGame();
      return;
  }


  
  this.currentPlayerIndex = 0;
  this.results = [];
  
  this.round++;
  this.turn();
  }
  finishGame() {
    // Best of max score logic
    const winningScore = Math.ceil(this.totalRounds / 2);

    
    const winnerIndex = this.scores.findIndex(score => score >= winningScore);
    if (winnerIndex !== -1) {
      this.setAttribute("winner", `player${winnerIndex + 1}`);
      this.players[winnerIndex].classList.add('highlight');
    } else {
      this.setAttribute("winner", "draw");
    }
    this.players.forEach(p => p.disablePlayer());
    console.log("Match finished. Winner:", this.getAttribute("winner"));
     this.dispatchEvent(new CustomEvent("game-ended",{
            bubbles: true,
            composed: true,
            detail: {
              name: this.players[winnerIndex].getAttribute('playername'),
              score: this.scores[winnerIndex]
            }
        }));
    this.boBtn.disabled = false;
    this.straightBtn.disabled = false;
    this.players.forEach((e)=> {
      e.removeAttribute('active');
    })
    this.newGameBtn.classList.add('highlight');
  }
  resetGame(){
    this.round = 1;
    this.currentPlayerIndex = 0;
    this.results = [];
    this.scores = Array(this.players.length).fill(0);
    this.newGameBtn.classList.remove('highlight');
    // Clear any game related attributes from the players
    this.players.forEach(p=>{
      p.removeAttribute('winner');
      p.setAttribute('score', "0");
      p.removeAttribute('active');
      p.disablePlayer();
      p.classList.remove('highlight');
    });
    this.removeAttribute('winner');
    this.applyGameRules();
  }
  _getTemplate() {
  const template = document.createElement('template');
  template.innerHTML = `
  <style>
    @keyframes pulse {
      0% {
        box-shadow: 0 0 6px 3px rgba(0, 255, 0, 0.6);
      }
      50% {
        box-shadow: 0 0 14px 8px rgba(0, 255, 0, 0.9);
      }
      100% {
        box-shadow: 0 0 6px 3px rgba(0, 255, 0, 0.6);
      }
    }

    button, select {
      padding: 10px;
    }

    div {
      display: flex;
      gap: 1rem;
      align-items: center;
      margin-bottom: 8px;
    }

    .flex {
      display: flex;
      flex-wrap: wrap;
      width: 100%;
      justify-content: space-around;
      gap: 2rem;
    }

    .highlight {
      animation: pulse 2s ease-in-out infinite;
      border-radius: 6px;
    }
    slot {
      display: contents;
    }

    </style>
    <div>
      <label for="include-straight">Include straight?</label>
      <input type="checkbox" id="straight" name="include-straight" checked/>
      <select id="bestof" name="bestof">
      <option value="3">Best of 3</option>
      <option value="5">Best of 5</option>
      <option value="7">Best of 7</option>
      </select>
      <button id="start-game">Start Game</button>
      <button id="new-game">New Game</button>
    </div>
    
    <div class="flex">
      <slot></slot>    
    </div>
    
    
  `;
  return template;
  }

}

customElements.define('dice-poker-board', DicePokerBoard);