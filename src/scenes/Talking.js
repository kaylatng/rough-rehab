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
    this.TEXT_Y = 460
    this.TEXT_SIZE = 28
    this.TEXT_MAX_WIDTH = 700

    this.SPEAKER_X = centerX
    this.SPEAKER_Y = 408
    this.SPEAKER_SIZE = 48
    this.SPEAKER_FONT = 'cheekyrabbit'

    this.NEXT_TEXT = '[SPACE]'
    this.NEXT_X = centerX
    this.NEXT_SIZE = 20
    this.NEXT_Y = 580 // 555

    this.SKIP_TEXT = '' // WIP skip will be added later
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

    // Puzzle constants
    this.PUZZLE_COLS = 3
    this.PUZZLE_ROWS = 3
    this.PUZZLE_PIECE_SIZE = 80
    this.PUZZLE_START_X = 280 // 150
    this.PUZZLE_START_Y = 150 // 100

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

    // puzzle variables
    this.playingPuzzle = false
    this.puzzlePieces = []
    this.puzzleComplete = false
    this.draggedPiece = null
    this.puzzleTargetSlots = []
    this.puzzleSourcePieces = []
    this.rt = null
    this.comboTimeLimit = 3000 // 3 seconds between placements
    this.comboTimer = null
    this.comboTimerText = null
    this.lastPlacementTime = null

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
    keySKIP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    this.choicebg = this.add.rectangle(centerX, centerY, 800, 600, 0x808080)
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
    if (this.playingPuzzle) {
      return
    } else if (this.waitingForChoice) {
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
        this.startPuzzle()
        this.sound.play('blip02', { volume: 0.2 })
      }
    } else {
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

      if (currentLine.choices) {
        this.showChoices(currentLine.choices)
        return
      }

      if (currentLine.state === 'end') {
        this.dialogDone = true
        this.dialogTyping = false
      }

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
    this.spaceKey.enabled = false

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

    this.choiceInstructionText = this.add.bitmapText(
      centerX,
      30,
      this.DBOX_FONT,
      'Choose a response as the mediator.',
      24
    ).setOrigin(0.5, 0).setTint(0xffffff)

    this.waitingForChoice = true
    this.dialogTyping = false
    this.selectedChoice = 0
    console.log("SHOWCHOICES: selectedChoice reset to 0")

    this.choiceTexts.forEach(text => text.destroy())
    this.choiceTexts = []

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
        // WIP need to add hover visual
        this.selectedChoice = index
        this.updateChoiceDisplay()
      })

      choiceText.on('pointerdown', () => {
        this.sound.play('blip02', { volume: 1.0 })
        this.selectedChoice = index
        console.log("SHOWCHOICES: selectedChoice is ", this.selectedChoice)
        this.startPuzzle()
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

  startPuzzle() {
    // hide choice text
    this.choiceTexts.forEach(text => text.setVisible(false))
    this.choiceboxGroup.setVisible(false)

    if (this.choiceInstructionText) {
      this.choiceInstructionText.destroy()
    }

    this.playingPuzzle = true
    this.puzzleComplete = false
    this.lastPlacementTime = null

    // create puzzle instruction text
    this.puzzleInstructionText = this.add.bitmapText(
      centerX,
      30,
      this.DBOX_FONT,
      'Keep the combo going! Place pieces quickly!',
      24
    ).setOrigin(0.5, 0).setTint(0xffffff)

    // create timer text (initially hidden)
    this.comboTimerText = this.add.bitmapText(
      centerX,
      60,
      this.DBOX_FONT,
      '',
      28
    ).setOrigin(0.5, 0).setTint(0xffff00)

    // generate the choice text as a texture
    const currentLine = this.dialog[this.dialogConvo][this.dialogLine]
    const selectedOption = currentLine.choices[this.selectedChoice]
    console.log("STARTPUZZLE: selectedOption is ", selectedOption, " selectedChoice is ", this.selectedChoice)
    const choiceText = selectedOption.text

    // create render texture
    const puzzleWidth = this.PUZZLE_COLS * this.PUZZLE_PIECE_SIZE
    const puzzleHeight = this.PUZZLE_ROWS * this.PUZZLE_PIECE_SIZE
    
    this.rt = this.add.renderTexture(120, 120, puzzleWidth, puzzleHeight)
    
    // draw colorful background with gradient effect
    const tempGraphics = this.add.graphics()
    for (let i = 0; i < this.PUZZLE_ROWS; i++) {
      for (let j = 0; j < this.PUZZLE_COLS; j++) {
        const colors = [0x6b5b95, 0x88b04b, 0xf7cac9, 0x92a8d1, 0x955251, 0xb565a7, 0x009b77, 0xdd4124, 0xd65076]
        const colorIndex = i * this.PUZZLE_COLS + j
        tempGraphics.fillStyle(colors[colorIndex % colors.length], 1)
        tempGraphics.fillRect(j * this.PUZZLE_PIECE_SIZE, i * this.PUZZLE_PIECE_SIZE, this.PUZZLE_PIECE_SIZE, this.PUZZLE_PIECE_SIZE)
        tempGraphics.lineStyle(2, 0xffffff, 1)
        tempGraphics.strokeRect(j * this.PUZZLE_PIECE_SIZE, i * this.PUZZLE_PIECE_SIZE, this.PUZZLE_PIECE_SIZE, this.PUZZLE_PIECE_SIZE)
      }
    }
    this.rt.draw(tempGraphics, 0, 0)
    
    // draw text over it
    const tempText = this.add.bitmapText(
      puzzleWidth / 2,
      puzzleHeight / 2,
      this.DBOX_FONT,
      choiceText,
      28
    ).setOrigin(0.5).setTint(0xffffff)
    tempText.maxWidth = puzzleWidth - 30
    
    this.rt.draw(tempText, puzzleWidth / 2, puzzleHeight / 2)
    this.rt.setVisible(false)
    
    // create puzzle pieces
    this.createPuzzle(this.rt)

    tempGraphics.destroy()
    tempText.destroy()
  }

  createPuzzle(renderTexture) {
    const pieceWidth = this.PUZZLE_PIECE_SIZE
    const pieceHeight = this.PUZZLE_PIECE_SIZE

    // create target slots (where pieces should go)
    for (let row = 0; row < this.PUZZLE_ROWS; row++) {
      for (let col = 0; col < this.PUZZLE_COLS; col++) {
        const x = this.PUZZLE_START_X + col * pieceWidth + pieceWidth / 2
        const y = this.PUZZLE_START_Y + row * pieceHeight + pieceHeight / 2

        const slot = this.add.rectangle(x, y, pieceWidth - 4, pieceHeight - 4, 0x222222)
        slot.setStrokeStyle(3, 0xffffff, 0.8)
        slot.setData('correctRow', row)
        slot.setData('correctCol', col)
        
        this.puzzleTargetSlots.push(slot)
      }
    }

    // create puzzle pieces in random positions
    let positions = []
    for (let row = 0; row < this.PUZZLE_ROWS; row++) {
      for (let col = 0; col < this.PUZZLE_COLS; col++) {
        positions.push({ row, col })
      }
    }
    
    // shuffle positions
    positions = Phaser.Utils.Array.Shuffle(positions)

    for (let i = 0; i < positions.length; i++) {
      const { row, col } = positions[i]
      
      const pieceContainer = this.add.container(0, 0)
      const pieceBg = this.add.rectangle(0, 0, pieceWidth - 2, pieceHeight - 2, 0xffffff)
      
      // create piece from render texture as a sprite
      const pieceImg = this.add.renderTexture(0, 0, pieceWidth - 2, pieceHeight - 2)
      pieceImg.draw(this.rt, 
        (pieceWidth - 2) / 2 - col * pieceWidth + 80, 
        (pieceHeight - 2) / 2 - row * pieceHeight + 80
        // -40 if using puzzleTexture
        // +80 if using this.rt
      )
      pieceImg.setOrigin(0.5)
      
      const border = this.add.rectangle(0, 0, pieceWidth - 2, pieceHeight - 2)
      border.setStrokeStyle(2, 0x000000, 1)
      border.setFillStyle(0xffffff, 0)
      
      pieceContainer.add([pieceBg, pieceImg, border])
      
      // position at bottom of screen in shuffled order
      const startX = 80 + (i % this.PUZZLE_COLS) * (pieceWidth + 15)
      const startY = 370 + Math.floor(i / this.PUZZLE_COLS) * (pieceHeight + 15)
      pieceContainer.setPosition(startX, startY)
      pieceContainer.setSize(pieceWidth, pieceHeight)
      
      pieceContainer.setInteractive({ draggable: true, useHandCursor: true })
      pieceContainer.setData('correctRow', row)
      pieceContainer.setData('correctCol', col)
      pieceContainer.setData('placed', false)
      
      this.puzzleSourcePieces.push(pieceContainer)
    }

    // drag events
    this.input.on('dragstart', (pointer, gameObject) => {
      gameObject.setScale(1.05)
      this.children.bringToTop(gameObject)
    })

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX
      gameObject.y = dragY
    })

    this.input.on('dragend', (pointer, gameObject) => {
      gameObject.setScale(1)
      this.checkPiecePlacement(gameObject)
    })
  }

  startComboTimer() {
    // stop existing timer if any
    if (this.comboTimer) {
      this.comboTimer.remove()
    }

    let timeRemaining = this.comboTimeLimit / 1000
    
    this.comboTimer = this.time.addEvent({
      delay: 100,
      repeat: (this.comboTimeLimit / 100) - 1,
      callback: () => {
        timeRemaining = Math.max(0, timeRemaining - 0.1)
        this.comboTimerText.setText(`${timeRemaining.toFixed(1)}s`)
        
        // change color based on time remaining
        if (timeRemaining <= 1) {
          this.comboTimerText.setTint(0xff0000)
        } else if (timeRemaining <= 2) {
          this.comboTimerText.setTint(0xff9900)
        } else {
          this.comboTimerText.setTint(0xffff00)
        }
        
        if (timeRemaining <= 0) {
          this.failCombo()
        }
      },
      callbackScope: this
    })
  }

  checkPiecePlacement(piece) {
    const correctRow = piece.getData('correctRow')
    const correctCol = piece.getData('correctCol')
    
    // find the correct slot
    const correctSlot = this.puzzleTargetSlots.find(slot => 
      slot.getData('correctRow') === correctRow && 
      slot.getData('correctCol') === correctCol
    )

    // check if piece is close enough to its correct slot
    const distance = Phaser.Math.Distance.Between(
      piece.x, piece.y,
      correctSlot.x, correctSlot.y
    )

    if (distance < this.PUZZLE_PIECE_SIZE / 2) {
      // snap to correct position
      piece.setPosition(correctSlot.x, correctSlot.y)
      piece.setData('placed', true)
      piece.disableInteractive()
      this.sound.play('blip01', { volume: 0.3 })
      
      // flash the piece briefly
      this.tweens.add({
        targets: piece,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        ease: 'Linear'
      })
      
      // start or restart the combo timer
      this.startComboTimer()
      
      const allPlaced = this.puzzleSourcePieces.every(p => p.getData('placed'))
      if (allPlaced) {
        this.completePuzzle()
      }
    }
  }

  failCombo() {
    // stop the timer
    if (this.comboTimer) {
      this.comboTimer.remove()
      this.comboTimer = null
    }

    // stop accepting input
    this.input.off('dragstart')
    this.input.off('drag')
    this.input.off('dragend')
    
    // make all PLACED pieces float away
    this.puzzleSourcePieces.forEach((piece, index) => {
      if (piece.getData('placed')) {
        piece.disableInteractive()
        
        // random direction and distance
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2)
        const distance = Phaser.Math.Between(300, 600)
        const targetX = piece.x + Math.cos(angle) * distance
        const targetY = piece.y + Math.sin(angle) * distance
        
        this.tweens.add({
          targets: piece,
          x: targetX,
          y: targetY,
          alpha: 0,
          rotation: Phaser.Math.FloatBetween(-2, 2),
          duration: 2000,
          delay: index * 100,
          ease: 'Cubic.easeOut'
        })
      }
    })
    
    // show failure message
    const failText = this.add.bitmapText(
      centerX,
      centerY,
      this.DBOX_FONT,
      'Combo broken! Try again...',
      32
    ).setOrigin(0.5).setTint(0xff0000).setAlpha(0)
    
    this.tweens.add({
      targets: failText,
      alpha: 1,
      duration: 500,
      yoyo: true,
      hold: 1000,
      onComplete: () => {
        failText.destroy()
        this.cleanupPuzzle()
        // restart the puzzle
        this.startPuzzle()
      }
    })
  }

  completePuzzle() {
    this.sound.play('blip02', { volume: 0.5 })
    
    // stop the timer
    if (this.comboTimer) {
      this.comboTimer.remove()
      this.comboTimer = null
    }
    
    this.cameras.main.flash(500, 255, 255, 255)
    
    this.time.delayedCall(800, () => {
      this.cleanupPuzzle()
      this.selectChoice()
    })
    this.rt.destroy()
  }

  cleanupPuzzle() {
    this.puzzleSourcePieces.forEach(piece => piece.destroy())
    this.puzzleTargetSlots.forEach(slot => slot.destroy())
    this.puzzleSourcePieces = []
    this.puzzleTargetSlots = []
    
    if (this.puzzleInstructionText) {
      this.puzzleInstructionText.destroy()
    }
    
    if (this.comboTimerText) {
      this.comboTimerText.destroy()
    }
    
    if (this.comboTimer) {
      this.comboTimer.remove()
      this.comboTimer = null
    }
    
    this.playingPuzzle = false
  }

  selectChoice() {
    // WIP need to fix choice selection after 2nd choice pop-up
    const currentLine = this.dialog[this.dialogConvo][this.dialogLine]
    console.log("SELECTCHOICE: printing currentLine ", currentLine)
    console.log("SELECTCHOICE: printing selectedChoice ", this.selectedChoice)

    if (!currentLine.choices) {
      console.error("selectChoice called on a line w/o choices RETURN")
      return
    }

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

    this.spaceKey.enabled = true
  }
}