class DicePokerDie extends HTMLElement {
  static faces = ['A', 'K', 'Q', 'J', '8', '7'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));
    this.faceEl = this.shadowRoot.querySelector('#face');
  }

  static get observedAttributes() {
    return ['face', 'onhold', 'hidden-face'];
  }

  connectedCallback() { this.render(); }
  attributeChangedCallback() { this.render(); }

  render() {
    const face = this.getAttribute('face');
    const hidden = this.hasAttribute('hidden-face');

    if (hidden) {
      this.faceEl.textContent = '?';
      this.faceEl.className = 'hidden';
      return;
    }

    this.faceEl.textContent = face || '';
    const red = ['A', 'K', '8'];
    const black = ['Q', 'J', '7'];
    if (red.includes(face)) {
      this.faceEl.className = 'red';
    } else if (black.includes(face)) {
      this.faceEl.className = 'black';
    } else {
      this.faceEl.className = '';
    }
  }

  setFace(face) {
    this.setAttribute('face', face);
  }

  diceRoll() {
    const faces = this.constructor.faces;
    this.setAttribute('face', faces[Math.floor(Math.random() * faces.length)]);
  }

  _getTemplate() {
    const template = document.createElement('template');
    template.innerHTML = `
    <style>
      :host {
        aspect-ratio: 1/1;
        border: 2px solid rgba(0,0,0,0.4);
        display: grid;
        place-items: center;
        font-size: 2rem;
        font-weight: bold;
        border-radius: 8px;
        background-color: var(--die-bg-color);
        user-select: none;
        flex: 0 1 62px;
        cursor: default;
        transition: background-color 0.15s, transform 0.1s;
        box-shadow: 2px 2px 4px rgba(0,0,0,0.4);
      }
      :host([onhold]) {
        background-color: var(--die-held-color);
        transform: translateY(-4px);
        box-shadow: 2px 6px 8px rgba(0,0,0,0.4);
      }
      :host([hidden-face]) {
        background-color: var(--theme-background-alt, #2a5a2a);
        cursor: not-allowed;
      }
      .black { color: var(--die-face-color-black); }
      .red   { color: var(--die-face-color-red); }
      .hidden { color: var(--theme-text-secondary, rgba(255,255,255,0.3)); font-size: 1.5rem; }
    </style>
    <div id="face"></div>`;
    return template;
  }
}

if (!customElements.get('dice-poker-die')) {
    customElements.define('dice-poker-die', DicePokerDie);
}
