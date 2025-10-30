// BACK-UP DO NOT MODIFY
//
//
//

class Talking extends Phaser.Scene {
  constructor() {
    super('talkingScene')
  }

  init() {
    // dialog constants
    this.DBOX_X = 25
    this.DBOX_Y = 400
    this.DBOX_FONT = 'futurahandwritten'

    this.TEXT_X = 50
    this.TEXT_Y = 460   // <-- stays near bottom for dialog text
    this.TEXT_SIZE = 28
    this.TEXT_MAX_WIDTH = 700

    this.SPEAKER_X = centerX
    this.SPEAKER_Y = 408
    this.SPEAKER_SIZE = 48
    this.SPEAKER_FONT = 'cheekyrabbit'

    this.NEXT_TEXT = '[SPACE]'
    this.NEXT_X = centerX
    this.NEXT_SIZE = 20
    this.NEXT_Y = 555

    this.SKIP_TEXT = '[ENTER to SKIP]'
    this.SKIP_X = centerX
    this.SKIP_Y = 580
    this.SKIP_SIZE = 15

    this.LETTER_TIMER = 10

    // choice display constants (top half)
    this.CHOICE_X = 100
    this.CHOICE_Y = 150
    this.CHOICE_SIZE = 28
    this.CHOICE_SPACING = 100
    this.CHOICE_MAX_WIDTH = 600

    this.CBOX_X = 90
    this.CBOX_Y = 142

    // dialog variables
    this.dialogConvo = 0
    this.dialogLine = 0
    this.dialogSpeaker = null
    this.dialogLastSpeaker = null
    this.dialogTyping = false
    this.dialogText = null
    this.nextText = null
    this.skipText = null
    this.dialogDone = false

    // choice variables
    this.waitingForChoice = false
    this.choiceTexts = []
    this.selectedChoice = 0

    // character variables
    this.tweenDuration = 500
    this.OFFSCREEN_BOY = -500
    this.OFFSCREEN_GIRL = 1300
  }
  
  preload() {
    this.load.path = "./assets/"
    this.load.json('dialog', 'json/dialog.json')
    this.load.audio('blip01', 'audio/blip01.wav')
    this.load.audio('blip02', 'audio/blip02.wav')
    this.load.audio('bgm', 'audio/docklisttomodachiost.mp3')
    this.load.image('dialogbox', 'img/dialogbox.png')
    this.load.image('choicebox', 'img/choicebox.png')
    this.load.image('boy', 'img/boy.png')
    this.load.image('girl', 'img/girl.png')
    this.load.image('bgimg', 'img/couch.jpg')
    this.load.bitmapFont('futurahandwritten', 'fonts/futurahandwritten/futurahandwritten.png', 'fonts/futurahandwritten/futurahandwritten.xml')
    this.load.bitmapFont('cheekyrabbit', 'fonts/cheekyrabbit/cheekyrabbit.png', 'fonts/cheekyrabbit/cheekyrabbit.xml')
  }

  create() {
    this.bgimg = this.add.tileSprite(0, 0, 800, 600, 'bgimg').setOrigin(0, 0)
    this.bgimg.setScale(1)

    this.bgm = this.sound.add('bgm', {
      volume: 0.1,
      loop: true,
    });
    this.bgm.play()


    this.boy = new Character(this, this.OFFSCREEN_BOY, 320, 'boy')
    this.girl = new Character(this, this.OFFSCREEN_GIRL, 320, 'girl')
    this.boy.sprite.setScale(1)
    this.girl.sprite.setScale(1)

    this.dialog = this.cache.json.get('dialog')
    this.dialogbox = this.add.sprite(this.DBOX_X, this.DBOX_Y, 'dialogbox').setOrigin(0)

    this.dialogText = this.add.bitmapText(this.TEXT_X, this.TEXT_Y, this.DBOX_FONT, '', this.TEXT_SIZE)
    this.nextText = this.add.bitmapText(this.NEXT_X, this.NEXT_Y, this.DBOX_FONT, '', this.NEXT_SIZE).setOrigin(0.5, 0)
    this.speakerName = this.add.bitmapText(this.SPEAKER_X, this.SPEAKER_Y, this.SPEAKER_FONT, '', this.SPEAKER_SIZE).setOrigin(0.5, 0)
    this.skipText = this.add.bitmapText(this.SKIP_X, this.SKIP_Y, this.DBOX_FONT, '', this.SKIP_SIZE).setOrigin(0.5, 0)

    this.tweens.add({
      targets: this.boy.sprite,
      x: 255,
      duration: this.tweenDuration,
      ease: 'Linear'
    })

    this.tweens.add({
      targets: this.girl.sprite,
      x: 600,
      duration: this.tweenDuration,
      ease: 'Linear'
    })

    cursors = this.input.keyboard.createCursorKeys()
    keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q)
    keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
    keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    keySKIP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)

    this.choicebg = this.add.rectangle(centerX, centerY, 800, 600, 0x808080);
    this.choicebg.alpha = 0.7
    this.choicebg.setVisible(false)
    this.choicebg.setActive(false)

    this.choiceboxGroup = this.add.group();
    this.choicebox = this.add.sprite(this.CBOX_X, this.CBOX_Y, 'choicebox').setOrigin(0)
    this.choicebox2 = this.add.sprite(this.CBOX_X, this.CBOX_Y + 100, 'choicebox').setOrigin(0)
    this.choicebox3 = this.add.sprite(this.CBOX_X, this.CBOX_Y + 200, 'choicebox').setOrigin(0)
    this.choiceboxGroup.add(this.choicebox)
    this.choiceboxGroup.add(this.choicebox2)
    this.choiceboxGroup.add(this.choicebox3)

    this.choiceboxGroup.setVisible(false)
    this.choiceboxGroup.setActive(false)

    this.typeText()
  }

  update() {
    if (this.waitingForChoice) {
      // WIP keyboard controls
      if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
        this.selectedChoice = Math.max(0, this.selectedChoice - 1)
        this.updateChoiceDisplay()
        this.sound.play('blip01', { volume: 0.2 })
      }
      if (Phaser.Input.Keyboard.JustDown(cursors.down)) {
        this.selectedChoice = Math.min(this.choiceTexts.length - 1, this.selectedChoice + 1)
        this.updateChoiceDisplay()
        this.sound.play('blip01', { volume: 0.2 })
      }
      if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
        this.selectChoice()
        this.sound.play('blip02', { volume: 0.2 })
      }
    } else {
      // if (Phaser.Input.Keyboard.JustDown(cursors.space) && !this.dialogTyping) {
      //   this.typeText()
      //   this.sound.play('blip02', { volume: 0.2 })
      // }

      // if (Phaser.Input.Keyboard.JustDown(cursors.space) && this.dialogDone) {
      //   this.boy.destroy()
      //   this.girl.destroy()
      //   this.sound.play('blip02', { volume: 0.2 })
      //   this.scene.start('End')
      // }
      if (Phaser.Input.Keyboard.JustDown(cursors.space) && !this.dialogTyping && !this.dialogDone) {
        this.typeText()
        this.sound.play('blip02', { volume: 0.2 }) 
      }

      if (Phaser.Input.Keyboard.JustDown(cursors.space) && this.dialogDone) {
        this.boy.destroy()
        this.girl.destroy()
        this.sound.play('blip02', { volume: 0.2 })
        this.scene.start('endScene')
      }
    }

    if (Phaser.Input.Keyboard.JustDown(keySKIP)) {
      this.sound.play('blip02', { volume: 1.0 })
      this.scene.start('endScene')
    }
  }

  typeText() {
    this.dialogTyping = true
    this.dialogText.text = ''
    this.nextText.text = ''
    this.speakerName.destroy()

    if (this.dialogLine > this.dialog[this.dialogConvo].length - 1) {
      this.dialogLine = 0
      this.dialogConvo++
    }

    if (this.dialogConvo >= this.dialog.length) {
      this.dialogbox.visible = false
      this.dialogDone = true
      this.scene.start('endScene')
    } else {
      const currentLine = this.dialog[this.dialogConvo][this.dialogLine]

      // handle choice lines
      if (currentLine.choices) {
        this.showChoices(currentLine.choices)
        return
      }

      // WIP check if dialog had reached end state
      if (currentLine.state === 'end') {
        this.dialogDone = true
        this.dialogTyping = false
      }

      // reset dialog position to normal speaking
      this.dialogText.setPosition(this.TEXT_X, this.TEXT_Y)

      this.dialogSpeaker = currentLine['speaker']
      let dialogSprite = this.dialogSpeaker == 'boy' ? this.boy.sprite : this.girl.sprite

      if (this.dialogSpeaker == 'girl') {
        this.boy.sprite.setTint(0x808080)
        this.girl.sprite.clearTint()
      } else if (this.dialogSpeaker == 'boy') {
        this.boy.sprite.clearTint()
        this.girl.sprite.setTint(0x808080)
      }

      if (currentLine['action']) {
        const action = currentLine['action']
        if (action === 'shake') {
          const originalX = dialogSprite.x
          this.tweens.add({
            targets: dialogSprite,
            x: originalX - 20,
            duration: 150,
            yoyo: true,
            repeat: 1,
            ease: 'Sine.easeInOut'
          })
        }
      }

      if (currentLine['newSpeaker'] == "true") {
        this.tweens.addCounter({
          from: 0.9,
          to: 0.95,
          duration: 150,
          yoyo: true,
          onUpdate: (tween) => {
            const v = tween.getValue()
            dialogSprite.setScale(v + .1)
          },
        })
      }

      this.speakerName = this.add.bitmapText(
        this.SPEAKER_X,
        this.SPEAKER_Y,
        this.SPEAKER_FONT,
        `${currentLine['speaker'].toUpperCase()}`,
        this.SPEAKER_SIZE
      ).setOrigin(0.5, 0)

      this.speakerDialog = currentLine['dialog']

      let currentChar = 0
      this.textTimer = this.time.addEvent({
        delay: this.LETTER_TIMER,
        repeat: this.speakerDialog.length - 1,
        callback: () => {
          this.dialogText.text += this.speakerDialog[currentChar]
          currentChar++
          if (this.textTimer.getRepeatCount() == 0) {
            this.nextText = this.add.bitmapText(this.NEXT_X, this.NEXT_Y, this.DBOX_FONT, this.NEXT_TEXT, this.NEXT_SIZE).setOrigin(0.5, 1)
            this.skipText = this.add.bitmapText(this.SKIP_X, this.SKIP_Y, this.DBOX_FONT, this.SKIP_TEXT, this.SKIP_SIZE).setOrigin(0.5, 1)
            this.dialogTyping = false
            this.textTimer.destroy()
          }
        },
        callbackScope: this
      })

      this.dialogText.maxWidth = this.TEXT_MAX_WIDTH
      this.dialogLine++
      this.dialogLastSpeaker = this.dialogSpeaker
    }
  }

  showChoices(choices) {
    this.choicebg.setVisible(true)
    this.choicebg.setActive(true)

    this.choiceboxGroup.setVisible(true)
    this.choiceboxGroup.setActive(true)

    if (choices.length === 2 && this.choicebox3) {
      this.choicebox3.setVisible(false)
      this.choicebox3.setActive(false)
    } else if (this.choicebox3) {
      this.choicebox3.setVisible(true)
      this.choicebox3.setActive(true)
    }

    this.waitingForChoice = true
    this.dialogTyping = false
    this.selectedChoice = 0

    this.choiceTexts.forEach(text => text.destroy())
    this.choiceTexts = []

    // this.speakerName = this.add.bitmapText(
    //   this.SPEAKER_X,
    //   80,
    //   this.SPEAKER_FONT,
    //   'YOU',
    //   this.SPEAKER_SIZE
    // ).setOrigin(0.5, 0)

    // this.dialogText = this.add.bitmapText(
    //   this.TEXT_X,
    //   this.CHOICE_Y - 40,
    //   this.DBOX_FONT,
    //   'What should you say?',
    //   this.TEXT_SIZE
    // )

    choices.forEach((choice, index) => {
      const choiceText = this.add.bitmapText(
        this.CHOICE_X,
        this.CHOICE_Y + (index * this.CHOICE_SPACING),
        this.DBOX_FONT,
        `${index + 1}. ${choice.text}`,
        this.CHOICE_SIZE
      )
      choiceText.maxWidth = this.CHOICE_MAX_WIDTH
      choiceText.setInteractive({ useHandCursor: true })

      choiceText.on('pointerover', () => {
        this.selectedChoice = index
        this.updateChoiceDisplay()
      })

      choiceText.on('pointerdown', () => {
        this.sound.play('blip02', { volume: 1.0 })
        this.selectedChoice = index
        this.selectChoice()
      })

      this.choiceTexts.push(choiceText)
    })

    this.updateChoiceDisplay()
  }

  updateChoiceDisplay() {
    this.choiceTexts.forEach((text, index) => {
      if (index === this.selectedChoice) {
        text.setTint(0xffff00)
      } else {
        text.clearTint()
      }
    })
  }

  selectChoice() {
    const currentLine = this.dialog[this.dialogConvo][this.dialogLine]
    const selectedOption = currentLine.choices[this.selectedChoice]

    this.choiceTexts.forEach(text => text.destroy())
    this.choiceTexts = []
    this.waitingForChoice = false

    if (selectedOption.nextConvo !== undefined) {
      this.dialogConvo = selectedOption.nextConvo
      this.dialogLine = 0
    } else {
      this.dialogLine++
    }

    this.typeText()

    this.choicebg.setVisible(false)
    this.choicebg.setActive(false)

    this.choiceboxGroup.setVisible(false)
    this.choiceboxGroup.setActive(false)
  }
}
