class Dice {
  constructor(id) {
    this.id = id;
    this.value = 0; 
    this.isHeld = false;
  }

  roll() {
    this.value = Math.floor(Math.random() * 6) + 1;
  }

  toggleHold() {
    this.isHeld = !this.isHeld;
  }
  
}

module.exports = Dice;
