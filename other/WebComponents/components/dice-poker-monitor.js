class DicePokerMonitor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const template = this._getTemplate();
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.statusMonitor = this.shadowRoot.querySelector('.statusmonitor');
  }

 connectedCallback() {
  const slot = this.shadowRoot.querySelector('slot');
  
  slot.addEventListener('slotchange', () => {
  const [board] = slot.assignedElements();
  // Forcing the board to load so the monitor can guarentee getting the events
  if (!board) return;
  board.addEventListener("player-roll",(e)=>{
      this._makeStatus(`${e.detail.name}: Rolls faces: ${e.detail.faces} rolls left: ${e.detail.rollsLeft}`)
    });

  board.addEventListener("game-start", (e)=>{
    this._makeStatus(`Game Started: Players: ${e.detail.players} Best Of ${e.detail.bestOf}`);
  });
  
  board.addEventListener("turn-finish", (e) => {
    this._makeStatus(`${e.detail.name}: finishes turn faces: ${e.detail.faces}`);
  });

  board.addEventListener("round-finish", (e) => {
    this._makeStatus(`Round ${e.detail.round}:  ${e.detail.name} wins round with ${e.detail.hand}`);
  });
  board.addEventListener("game-ended", (e)=>{
    this._makeStatus(`Game Over: ${e.detail.name} Wins! Score: ${e.detail.score}`);
  });
  
  
  });

}
  _makeStatus(text) {
  const p = document.createElement('p');
  p.textContent = text;
  this.statusMonitor.appendChild(p);
  this.statusMonitor.scrollTop = this.statusMonitor.scrollHeight;
  }
  _getTemplate(){
    const template = document.createElement('template');
    template.innerHTML = `
    <style>
      h2{
      font-size: 1.5rem;
      text-align: right;
      padding: 3px;
      // text-shadow:
      // 0 0 1px rgba(0, 255, 0, 0.9),
      // 0 0 1px rgba(0, 255, 0, 0.7),
      // 0 0 1px rgba(0, 255, 0, 0.5);
      }
      .board{
        display: block;
      }
    </style>
    <div class="statusmonitor" part="monitor">
    <h2>Lupus Mapping OS&trade;</h2>

    </div>
    <div class="board">
    <slot></slot>
    </div>
    `;
    return template
  }


}

customElements.define('dice-poker-monitor', DicePokerMonitor);
