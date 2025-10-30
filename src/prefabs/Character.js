// class for talking sprites
class Character extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture) {
    super(scene, x, y, texture)

    this.sprite = scene.physics.add.sprite(x, y, texture)
    this.sprite.setOrigin(0.5, 0.5)
    this.sprite.setImmovable(true)
  }
}