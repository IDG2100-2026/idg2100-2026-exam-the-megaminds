class DicePokerPlayer extends HTMLElement {
    constructor(){
        super();
        this.attachShadow({ mode: 'open' });
        const template = this._getTemplate();
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.rollButton = this.shadowRoot.getElementById('roll')
        this.holdButton = this.shadowRoot.getElementById('hold');
        this.continueButton = this.shadowRoot.getElementById('continue');
        this.playerName = this.getAttribute('playername') || 'Unknown';
        this.score = this.getAttribute('score') || 0;
        this.rollCount = 0;

    }
     static get observedAttributes() { 
        return ['active','score']; 
    }
    connectedCallback(){
        this.render();
        this.setEventListeners();
        this.rollButton.disabled = true;
        this.holdButton.disabled = true;
        this.continueButton.disabled = true;
    }
    render(){
        const name = this.shadowRoot.querySelector('#name');
        name.textContent = this.playerName;
        const score = this.shadowRoot.querySelector('#wins');
        score.textContent = `Score: ${this.score}`;
        const rolls = this.shadowRoot.querySelector('#rolls');
        rolls.textContent = `Rolls used of 3: ${this.rollCount}`;
    }
    attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'score') {
    this.score = newValue;
    this.render();
    }
    }

    setEventListeners(){
    this.rollButton.addEventListener('click', ()=>this.rollDice());
    this.holdButton.addEventListener('click', ()=>this.holdDice());
    this.continueButton.addEventListener('click', ()=>this.finishTurn());
    }

    
    startTurn(){
        this.rollButton.disabled = false;
        this.holdButton.disabled = true;
        this.continueButton.disabled = true;
        
        this.rollCount = 0;
        this.render();
    }

    rollDice(){
        this.rollCount ++;
        const maxRolls = 3; 
        if(this.rollCount === maxRolls){
            this.rollButton.disabled = true;
            this.holdButton.disabled = true;
        }
        if(this.rollCount === 1){
            this.holdButton.disabled = false;
            this.continueButton.disabled = false;
        }
        const dice = this.shadowRoot.querySelectorAll('dice-poker-die');
        dice.forEach(die=>{
            if(!die.hasAttribute('onhold')){
                die.diceRoll();
            }
        });
        this.render();
         this.dispatchEvent(new CustomEvent("player-roll",{
            bubbles: true,
            composed: true,
            detail: {
                faces: this.getFaces(),
                name: this.playerName,
                rollsLeft: maxRolls - this.rollCount
            }
        }));
    }
    holdDice(){
        const dice = this.shadowRoot.querySelectorAll('dice-poker-die');
        // Adding the event to all the dice and checking if they have hold or not
        dice.forEach(die=>{
            die.addEventListener('click',()=>{
            if(!die.hasAttribute('onhold')){
                die.classList.add('held');
                die.setAttribute('onhold', "");
            } else{
                die.removeAttribute('onhold');
                die.classList.remove('held');
            }
            });
        });
    }
    disablePlayer(){
        this.rollButton.disabled = true;
        this.holdButton.disabled = true;
        this.continueButton.disabled = true;
    }
    getFaces(){
        return [...this.shadowRoot.querySelectorAll('dice-poker-die')].map(die=>die.getAttribute('face'));
    }
    finishTurn(){
        const faces = this.getFaces();
        this.rollCount = 0
        this.render();
        const dice = this.shadowRoot.querySelectorAll('dice-poker-die');
        dice.forEach(die=>{
                die.removeAttribute('onhold');
                die.classList.remove('held');
            });
        this.dispatchEvent(new CustomEvent("player-turn-finished",{
            bubbles: true,
            composed: true,
            detail: {
                faces,
                name: this.playerName
            }
        }));
    }
    _getTemplate(){
        const template = document.createElement('template');
        template.innerHTML = `
        <style>
        @keyframes click-pop {
        0%   { transform: scale(1); }
        50%  { transform: scale(0.93); }
        100% { transform: scale(1); }
        }
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
        :host{
        padding: 10px;
        background-color: #0f700f;
        border: var(--wood-border);
        border-radius: 20px;
        }
        :host(.highlight) {
        animation: pulse 3s ease-in-out infinite;
        }

        :host([active]) {
        border: 8px solid gold;
        }
        button {
        transition: background-color 120ms ease-out, color 120ms ease-out;
        font-size: 1.3rem;
        text-transform: uppercase;
        }

        button:active {
        animation: var(--click-animation);
        }

        .button-container{
        width: 100%;
        margin-top: 5px;
        display: flex;
        gap: 0.5rem;
        }
        .dice-container{
        display: flex;
        flex-wrap: wrap;
        gap: 1px;
        justify-content: space-between;
        }
        .held{
        background-color: var(--die-held-color);
        }
        .player-score{
        display: flex;
        justify-content: space-between;
        }
        #hold{
        padding: 10px;
        flex: 0 1 150px;
        box-shadow: var(--small-shadow);
        border-radius: 10px;
        border: none;
        }
        #roll{
        padding: 10px;
        flex: 0 1 150px;
        box-shadow: var(--small-shadow);
        border-radius: 10px;
        border: none;
        }
        #rolls{
        margin-top: 2px;
        margin-bottom: 2px;
        }
        #continue{
        padding: 10px;
        flex: 0 1 150px;
        border-radius: 10px;
        border: none;
        box-shadow: var(--small-shadow);
        }
        </style>
        <div part="player">
        <div class="player-score">
        <p id="name"></p>
        <p id="wins">Score: 0</p>
        </div>
        
        <p id="rolls">Rolls used of 3: 0</p>
        <div class="dice-container">
        <dice-poker-die face=""></dice-poker-die>
        <dice-poker-die face=""></dice-poker-die>
        <dice-poker-die face=""></dice-poker-die>
        <dice-poker-die face=""></dice-poker-die>
        <dice-poker-die face=""></dice-poker-die>
        <div class="button-container">
        <button id="roll">Roll</button>
        <button id="hold">Hold</button>
        <button id="continue">Finish Turn</button>
        </div>
        </div>
        </div>
        `;
        return template;
    }
}
customElements.define('dice-poker-player', DicePokerPlayer);
