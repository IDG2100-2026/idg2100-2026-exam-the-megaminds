class DicePokerDie extends HTMLElement {
  static faces = ['A', 'K', 'Q', 'J', '8', '7'];
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const template = this._getTemplate();
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.faceEl = this.shadowRoot.querySelector('#face');
  }
   static get observedAttributes() { 
    return ['face','onhold']; 
  }

  connectedCallback() {
    this.render();
  }
   attributeChangedCallback() { 
    this.render(); 
  }
  render() {
  const face = this.getAttribute('face');
  this.faceEl.textContent = face;
  const red = ['A','K','8'];
  const black = ['Q','J','7'];
  if(red.includes(this.faceEl.textContent)){
    this.faceEl.classList.add('red');
    this.faceEl.classList.remove('black');
  } else if(black.includes(this.faceEl.textContent)){
    this.faceEl.classList.remove('red');
    this.faceEl.classList.add('black');
  }
  }

 diceRoll() {
  const faces = this.constructor.faces;
  console.log(faces);
  const randomIndex = Math.floor(Math.random() * faces.length);
  const randomFace = faces[randomIndex];
  console.log(randomFace);
  this.setAttribute('face', randomFace);
}

  _getTemplate(){
    const template = document.createElement('template');
    template.innerHTML = `
    <style>
      :host{
        aspect-ratio: 1/1;
        border: 2px solid black;
        display: grid;
        place-items: center;
        font-size: 2rem;
        font-weight: bold;
        border-radius: 6px;
        background-color: var(--die-bg-color);
        user-select: none;
      }
      .black{
        color: var(--die-face-color-black);
      }
      .red{
        color: var(--die-face-color-red);
      }
      :host{
        flex: 0 1 60px;
      }
    </style>

    <div class="die" id="face"></div>`;
    return template;

  }
}

customElements.define('dice-poker-die', DicePokerDie);
