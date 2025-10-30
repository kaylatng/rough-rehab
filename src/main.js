/**
 * ----- ASSETS USED ----------------------------------------------------
 * AUDIO:
 *  blip_01 - freesound.org/people/AceOfSpadesProduc100/sounds/341024/
 *  blip_02 - freesound.org/people/Tissman/sounds/443907/
 *  flame - freesound.org/people/ReincarnatedEchoes/sounds/680696/
 *  punch - freesound.org/people/FALL-E/sounds/712550
 *  fight - freesound.org/people/exe2be/sounds/553600/
 * BGM:
 *  encounter - freesound.org/people/joshuaempyre/sounds/251461/
 * 
 * ----- MAJOR COMPONENTS ------------------------------------------------
 * 1. Physics system: JuJu Fighter uses a physics collision system to inflict
 * damage on the player or the enemy.
 * 2. Text objects: Text objects used in title screens and play scenes such as
 * text signal that "Ability is on cooldown" used to inform player about how to play the game.
 * 3. Timers: Game clock is used to count down fight in case player does not defeat enemy in time.
 * Timers are also used to track ability cooldowns and enemy attack frequency.
 * 4. Animation manager: Animations used in state manager when enemy/player attacks. Animation
 * changes based on the object's state.
 * 5. Tween manager: Tweens used to animate Encounter scene where player reads dialogue
 * between Enemy and Hero. Tweens also used for text objects to make game feel more animated.
 * 
 */

let config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    },
  },
  scene: [ Talking, End ],
}

const game = new Phaser.Game(config)

// globals
const centerX = game.config.width / 2
const centerY = game.config.height / 2

let cursors, keySKIP
