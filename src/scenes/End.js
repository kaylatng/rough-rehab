class End extends Phaser.Scene {
  constructor() {
    super('endScene')
  }

  init(){

  }

  create(){
    this.bg = this.add.rectangle(centerX, centerY, 800, 600, 0x000000);
  }

  update(){
    
  }
}