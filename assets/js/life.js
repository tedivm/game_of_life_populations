
function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Simple wrapper around randomColor
function randomCellColor () {
  return randomColor({
    luminosity: 'bright',
    format: 'hsl'
  })
}


function randomInt (min, max, centeredness = 0) {
  if (centeredness) {
    return Math.floor(centeredRandom(centeredness) * Math.floor((max + 1) - min)) + min
  }
  return Math.floor(Math.random() * Math.floor((max + 1) - min)) + min
}

function coinFlip (probability = 0.5) {
  return Math.random() <= probability
}

function centeredRandom (loops = 4) {
  let total = 0
  for (let i = 0; i < loops; i++) {
    total += Math.random()
  }
  return total / loops
}

function drawTextBG (ctx, x, y, txt, opts = {}) {
  opts = Object.assign({
    'font': '15px Courier',
    'backgroundColor': 'black',
    'fontColor': 'white',
    'textBaseline': 'top',
    'textAlign': 'center'
  }, opts)
  ctx.save()
  ctx.font = opts.font
  const margin = 5
  const fontSize = parseInt(opts.font, 10) * 1.1
  const width = ctx.measureText(txt).width + (2 * margin)
  const height = fontSize
  let rectX
  let rectY
  switch (opts.textAlign) {
    case 'center':
      rectX = x - (width / 2)
      rectY = y - (height * 0.05)
      break
    default:
      rectX = x
      rectY = y - (height * 0.05)
  }

  ctx.textBaseline = opts.textBaseline
  ctx.textAlign = opts.textAlign
  ctx.fillStyle = opts.backgroundColor
  ctx.fillRect(rectX, rectY, width, height * 1.1)
  ctx.fillStyle = opts.fontColor
  ctx.fillText(txt, x, y)
  ctx.restore()
}

const hslRegex = /hsl\(\s*(\d{1,3}\.?\d*),\s*(\d{1,2}\.?\d*)%,\s*(\d{1,2}\.?\d*)%\s*\)/
function getHSL (str) {
  var match = str.match(hslRegex)
  return match ? {
    hue: match[1],
    saturation: match[2],
    lightness: match[3]
  } : {}
}

const possibleModes = [
  'majority',
  'blend_wheel',
  'blend_spectrum',
  'density',
  'monochrome',
  'generational']

class Life {
  constructor (canvas, opts) {
    this.opts = Object.assign({
      'size': 5,
      'sleep': 100,
      'print': false,
      'min_pop': 0.05,
      'start_pop': 0.35,
      'max_generations': false,
      'persistColors': null,
      'maxSpectrumRepeats': 5,
      'mode': false,
      'spectrum': 0.4,
      'onReset': false,
      'min_sleep': 5,
      'backgroundColor': false,
      'fps': false
    }, opts)
    this.pause = false
    this.increment = false
    this.canvas = canvas
    this.activeMode = false
    this.offgrid = 10
    this.resize()
  }

  resize () {
    this.rows = Math.floor(this.canvas.offsetHeight / this.opts.size) + (this.offgrid * 2)
    this.columns = Math.floor(this.canvas.offsetWidth / this.opts.size) + (this.offgrid * 2)
  }

  getGrid () {
    if (!this.grid) {
      this.generateRandomGrid()
    }
    return this.grid
  }

  steps (num = 1) {
    for (var x = 0; x < num; x++) {
      this.step()
    }
  }

  step () {
    var result = []
    var grid = this.getGrid()
    const that = this
    const color = randomCellColor()

    function _isFilled (x, y) {
      return grid[x] && grid[x][y]
    }

    function _countNeighbors (x, y, range = 1) {
      var amount = 0

      for (let nX = x - range; nX <= x + range; nX++) {
        for (let nY = y - range; nY <= y + range; nY++) {
          if (nY !== y || nX !== x) {
            if (_isFilled(nX, nY)) amount++
          }
        }
      }

      return amount
    }

    function _getNeighboringColors (x, y) {
      const colors = {}

      for (let i = -1; i < 2; i++) {
        if (!grid[x + i]) {
          continue
        }
        for (let j = -1; j < 2; j++) {
          if (grid[x + i][y + j]) {
            const color = grid[x + i][y + j]
            if (!colors[color]) {
              colors[color] = 1
            } else {
              colors[color]++
            }
          }
        }
      }
      return colors
    }

    function _getPredominentColor (x, y) {
      const colors = _getNeighboringColors(x, y)
      let best = []
      let bestCount = 0
      for (const color in colors) {
        if (colors[color] > bestCount) {
          best = [color]
          bestCount = colors[color]
        } else if (colors[color] === bestCount) {
          best.push(color)
        }
      }
      if (best.length < 1) {
        return randomCellColor()
      }

      return best[Math.floor(Math.random() * best.length)]
    }

    function _getColorBlendWheel (x, y) {
      const colors = _getNeighboringColors(x, y)

      const colorList = []

      for (const color in colors) {
        const hsl = getHSL(color)
        for (let x = 0; x < colors[color]; x++) {
          colorList.push([
            hsl.hue,
            hsl.saturation,
            hsl.lightness
          ])
        }
      }

      if (colorList.length < 1) {
        return randomCellColor()
      }

      const newColor = averageColor(colorList)
      return `hsl(${newColor[0]}, ${newColor[1]}%, ${newColor[2]}%)`
    }

    function _getColorBlendSpectrum (x, y) {
      const colors = _getNeighboringColors(x, y)

      const colorCode = {
        h: 0,
        s: 0,
        l: 0
      }

      let total = 0

      for (const color in colors) {
        let rgb = getHSL(color)
        colorCode.h += rgb.hue * colors[color]
        colorCode.s += rgb.saturation * colors[color]
        colorCode.l += rgb.lightness * colors[color]
        total += colors[color]
      }

      if (total < 1) {
        return randomCellColor()
      }

      colorCode.h = Math.round(colorCode.h / total)
      colorCode.s = Math.round(colorCode.s / total)
      colorCode.l = Math.round(colorCode.l / total)

      return `hsl(${colorCode.h}, ${colorCode.s}%, ${colorCode.l}%)`
    }

    function _getColorDensity (x, y) {
      if (!that.runtime.range) {
        that.runtime.range = randomInt(2, 5)
      }
      if (!that.runtime.direction) {
        that.runtime.direction = randomInt(1, 2)
      }

      if (!that.runtime.spectrumSize) {
        that.runtime.spectrumSize = randomInt(90, 120)
      }

      if (!that.runtime.density_offset) {
        const possibleRange = 360 - that.runtime.spectrumSize
        that.runtime.density_offset = randomInt(0, possibleRange)
      }

      const maxDensity = ((((that.runtime.range * 2) + 1) ** 2) - 1) * 0.4
      const neighbors = _countNeighbors(x, y, that.runtime.range)
      let density = Math.min((neighbors / maxDensity), 1)
      if (that.runtime.direction === 1) {
        density = 1.0 - density
      }

      const h = (density * that.runtime.spectrumSize) + that.runtime.density_offset
      return 'hsl(' + h + ', 100%, 50%)'
    }

    function _getGenerational (x, y) {
      if (typeof that.runtime.spectrum !== 'boolean') {
        that.runtime.spectrum = coinFlip(0.7)
      }
      if (!that.runtime.spectrum) {
        return color
      }
      if (!that.runtime.spread) {
        that.runtime.spread = randomInt(100, that.opts['max_generations'], 2)
      }
      if (!that.runtime.offset) {
        that.runtime.offset = Math.floor(Math.random() * that.runtime.spread)
      }
      const h = ((that.generation + that.runtime.offset) / that.runtime.spread) * 360
      return 'hsl(' + h + ', 100%, 50%)'
    }

    if (!this.generation) {
      this.generation = 0
    }
    this.generation++

    function _getNewColor (x, y) {
      switch (that.activeMode) {
        case 'majority':
          if (that.runtime.persistColors && _isFilled(x, y)) return grid[x][y]
          if (that.runtime.mutationRate > Math.random()) return randomCellColor()
          return _getPredominentColor(x, y)

        case 'blend_wheel':
          if (that.runtime.persistColors && _isFilled(x, y)) return grid[x][y]
          if (that.runtime.mutationRate > Math.random()) return randomCellColor()
          return _getColorBlendWheel(x, y)

        case 'blend_spectrum':
          if (that.runtime.persistColors && _isFilled(x, y)) return grid[x][y]
          if (that.runtime.mutationRate > Math.random()) return randomCellColor()
          return _getColorBlendSpectrum(x, y)

        case 'random':
          if (that.runtime.persistColors && _isFilled(x, y)) return grid[x][y]
          if (that.runtime.mutationRate > Math.random()) return randomCellColor()
          return randomCellColor()

        case 'generational':
          if (_isFilled(x, y)) return grid[x][y]
          return _getGenerational(x, y)

        case 'monochrome':
          if (!that.runtime.monochrome) {
            that.runtime.monochrome = randomCellColor()
          }
          return that.runtime.monochrome

        case 'density':
          return _getColorDensity(x, y)

        default:
          if (that.runtime.persistColors && _isFilled(x, y)) return grid[x][y]
          return _getPredominentColor(x, y)
      }
    }

    grid.forEach(function (row, x) {
      result[x] = []
      row.forEach(function (cell, y) {
        let alive = 0
        let count = _countNeighbors(x, y)

        if (cell) {
          alive = count === 2 || count === 3 ? 1 : 0
        } else {
          alive = count === 3 ? 1 : 0
        }

        if (!alive && that.runtime.spontaneous && that.generation % that.runtime.spontaneousGenerations === 0) {
          if (Math.random() < that.runtime.spontaneous) {
            alive = true
          }
        }

        if (alive) {
          result[x][y] = _getNewColor(x, y)
        } else {
          result[x][y] = 0
        }
      })
    })

    this.grid = result
  }

  generateRandomGrid (population = 0.5) {
    const that = this
    const spectrum = Math.random() < this.opts.spectrum

    // Define these here so they stay the same for each newly generated world.
    const direction = coinFlip()
    const rotation = coinFlip()
    const repeats = randomInt(1, this.opts.maxSpectrumRepeats)
    const xAdjust = randomInt(1, 1000)
    const yAdjust = randomInt(1, 1000)
    function getSpectrumColor (x, y) {
      function decimalize (num, factor = 10000) {
        return Math.floor((num * factor) % factor) / factor
      }

      const xB = (x + xAdjust) / (that.columns / repeats)
      const yB = (y + yAdjust) / (that.rows / repeats)

      const xN = decimalize(xB)
      const yN = decimalize(yB)

      let hueBase
      let hueDirection
      let lightnessBase
      let lightDirection

      if (rotation) {
        hueBase = xN
        hueDirection = Math.floor(xB % 2) === 0 ? direction : !direction
        lightnessBase = yN
        lightDirection = Math.floor(yB % 2) === 0 ? direction : !direction
      } else {
        hueBase = yN
        hueDirection = Math.floor(yB % 2) === 0 ? direction : !direction
        lightnessBase = xN
        lightDirection = Math.floor(xB % 2) === 0 ? direction : !direction
      }

      const hueModifier = hueDirection ? hueBase : 1 - hueBase
      const lightnessModifier = lightDirection ? lightnessBase : 1 - lightnessBase

      let hue = (hueModifier * 360) % 360
      let lightness = ((lightnessModifier * 50) % 50) + 30

      return `hsl(${hue}, 100%, ${lightness}%)`
    }

    var grid = []
    for (var x = 0; x < this.columns; x++) {
      for (var y = 0; y < this.rows; y++) {
        if (!grid[x]) grid[x] = []
        if (Math.random() > population) {
          grid[x][y] = 0
          continue
        }
        if (this.activeMode === 'monochrome' || this.activeMode === 'density' || this.activeMode === 'generation') {
          if (this.opts.backgroundColor) {
            grid[x][y] = 'hsl(0, 100%, 0%)' // black
          } else {
            grid[x][y] = 'hsl(0, 0%, 100%)' // white
          }
          continue
        }
        if (spectrum) {
          grid[x][y] = getSpectrumColor(x, y)
          continue
        }
        grid[x][y] = randomCellColor()
      }
    }
    this.grid = grid
  }

  draw () {
    var grid = this.getGrid()
    var string = ''
    for (var y = 0; y < this.rows; y++) {
      for (var x = 0; x < this.columns; x++) {
        string += bool(grid[x][y]) ? '1' : '0'
      }
      string += '\n'
    }
    console.log(string)
  }

  drawCanvas () {
    const height = this.canvas.offsetHeight
    const width = this.canvas.offsetWidth
    const ctx = this.canvas.getContext('2d')
    const grid = this.getGrid()
    const offgrid = 2
    const screenColumns = this.columns - (offgrid * 2)
    const screenRows = this.rows - (offgrid * 2)
    ctx.save()
    ctx.clearRect(0, 0, width, height)
    if (this.opts.backgroundColor) {
      ctx.fillStyle = this.opts.backgroundColor
      ctx.fillRect(0, 0, width, height)
    }

    for (var sX = 0; sX < screenColumns; sX++) {
      let gX = sX + offgrid
      if (!grid[gX]) {
        continue
      }
      for (var sY = -(offgrid); sY < screenRows; sY++) {
        let gY = sY + offgrid
        if (grid[gX][gY]) {
          ctx.fillStyle = grid[gX][gY]
          ctx.fillRect(sX * this.opts.size, sY * this.opts.size, this.opts.size, this.opts.size)
        }
      }
    }
    ctx.restore()
  }

  count () {
    const grid = this.getGrid()
    let count = 0

    for (let x = 0; x < this.columns; x++) {
      if (!grid[x]) {
        continue
      }
      for (let y = 0; y < this.rows; y++) {
        if (grid[x][y]) {
          count++
        }
      }
    }
    return count
  }

  size () {
    return this.rows * this.columns
  }

  adjust (opts = false) {
    if (opts) {
      this.opts = Object.assign(this.opts, opts)
    }
  }

  reset (opts = false) {
    if (opts) {
      this.opts = Object.assign(this.opts, opts)
    }

    this.runtime = {
      'startTime': (new Date()).getTime()
    }
    this.resize()
    this.generation = 0

    if (Math.random() < 0.1) {
      this.runtime.mutationRate = Math.random() * 0.10
    } else {
      this.runtime.mutationRate = 0
    }

    if (Math.random() < 0.05) {
      this.runtime.spontaneous = 0.001 * Math.random()
      this.runtime.spontaneousGenerations = randomInt(1, 3)
    } else {
      this.runtime.spontaneous = false
    }

    if (!this.opts.mode) {
      this.activeMode = possibleModes[Math.floor(Math.random() * possibleModes.length)]
    } else {
      this.activeMode = this.opts.mode
    }

    if (this.opts.persistColors === null) {
      this.runtime.persistColors = Math.random() >= 0.5
    } else {
      this.runtime.persistColors = this.opts.persistColors
    }

    this.generateRandomGrid(this.opts['start_pop'])
    this.step()

    if (this.opts.onReset) {
      this.opts.onReset(this)
    }
    this.drawCanvas()
  }

  async run (opts = {}) {
    this.reset()
    if (this.opts.print) {
      this.draw()
    }

    let sameCount = 0
    let lastPop = 0
    const firstRun = (new Date()).getTime()
    let lastRun = (new Date()).getTime()
    while (true) {
      let now = (new Date()).getTime()
      let sleepTime = Math.max(this.opts['sleep'] - (now - lastRun), this.opts['min_sleep'])
      await sleep(sleepTime)
      lastRun = (new Date()).getTime()

      if (this.pause) {
        continue
      }

      if (this.increment) {
        this.increment = false
        this.pause = true
      }

      if (!this.runtime.frames) {
        this.runtime.frames = [now]
      } else {
        this.runtime.frames.unshift(now)
      }

      let framerate = false
      if (this.runtime.frames.length > 30) {
        let oldest = this.runtime.frames.pop()
        framerate = Math.floor((this.runtime.frames.length + 1) / ((now - oldest) / 1000))
        if (this.opts.fpsDisplay && this.generation % this.opts.fpsDisplay === 0) {
          console.log(`${framerate}/s`)
        }
      }

      if (this.opts['max_generations'] && this.opts['max_generations'] <= this.generation) {
        console.log(`Resetting at generation ${this.generation}.`)
        this.reset()
        continue
      }

      this.step()

      // If population is too low reset the world.
      const curPop = this.count()
      const maxPop = this.rows * this.columns
      if (this.opts['min_pop'] > (curPop / maxPop)) {
        console.log(`Low population at generation ${this.generation}.`)
        this.reset()
        continue
      }

      // Detect when population isn't changing. Catches some, but not all, short loops.
      if (curPop === lastPop) {
        sameCount++
        if (sameCount >= this.opts['stale_count']) {
          this.reset()
          continue
        }
      } else {
        sameCount = 0
        lastPop = curPop
      }

      if (this.opts.print) {
        this.draw()
      }
      const sinceStart = (new Date()).getTime() - firstRun
      this.drawCanvas()
      this.drawTitle()
      if (this.opts.helpDisplay || sinceStart < 5000) {
        this.drawHelp()
      }
      if (this.opts.fps) {
        this.drawFPS(framerate)
      }
    }
  }

  drawFPS (fps) {
    const ctx = this.canvas.getContext('2d')
    const fontSize = 25
    if (fps) {
      drawTextBG(
        ctx,
        10,
        this.canvas.height - (fontSize * 2),
        `${fps}/s`,
        {
          font: `${fontSize}px Courier New`,
          fontColor: 'white',
          backgroundColor: 'black',
          textAlign: 'start'
        })
    }
    drawTextBG(
      ctx,
      10,
      this.canvas.height - fontSize,
      `${this.generation}`,
      {
        font: `${fontSize}px Courier New`,
        fontColor: 'white',
        backgroundColor: 'black',
        textAlign: 'start'
      })
  }

  drawHelp () {
    if (!this.opts.helpText) {
      return
    }

    const ctx = this.canvas.getContext('2d')
    ctx.save()
    const textChunks = this.opts.helpText.split('\n')
    const fontSize = 20
    const margin = 10
    let offset = 0

    const font = `${fontSize}px Courier New`
    ctx.font = font
    const longest = textChunks.reduce((a, b) => ctx.measureText(a).width > ctx.measureText(b).width ? a : b)
    const textWidth = ctx.measureText(longest).width * 1.2
    const textHeight = fontSize + ((textChunks.length - 1) * (fontSize + margin)) + 10
    const startX = (this.canvas.width / 2) - (textWidth / 2)
    const startY = (this.canvas.height / 2) - (textHeight / 2)

    ctx.fillStyle = 'black'
    ctx.fillRect(startX - (margin / 2), startY - (margin / 2), textWidth, textHeight)

    for (let chunk of textChunks) {
      drawTextBG(
        ctx,
        startX,
        startY + offset,
        chunk,
        {
          font: font,
          fontColor: 'white',
          backgroundColor: 'black',
          textAlign: 'start'
        })
      offset += fontSize + margin
    }

    ctx.restore()
  }

  drawTitle () {
    const sinceStart = (new Date()).getTime() - this.runtime.startTime
    const fadeStart = 2000
    const fadeTime = 3000
    if (sinceStart > (fadeStart + fadeTime)) {
      return
    }
    const mode = this.activeMode.replace('_', ' ').replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
    const ctx = this.canvas.getContext('2d')
    ctx.save()

    const modifiers = []

    if (['monochrome', 'density'].includes(this.activeMode)) {
      if (this.runtime.mutationRate > 0) {
        modifiers.push('mutations')
      }
    }

    if (this.activeMode === 'generational') {
      modifiers.push(this.runtime.spectrum ? 'spectrum' : 'random')
    }

    if (this.runtime.spontaneousGenerations > 0) {
      modifiers.push('spontaneous generation')
    }

    let title = mode
    if (modifiers.length) {
      title = `${title} (${modifiers.join(',')})`
    }

    if (sinceStart > fadeStart) {
      ctx.globalAlpha = 1 - ((sinceStart - fadeStart) / fadeTime)
    }
    const fontSize = 25
    drawTextBG(
      ctx,
      this.canvas.width / 2,
      this.canvas.height - fontSize,
      title,
      {
        font: `${fontSize}px Courier New`,
        fontColor: 'white',
        backgroundColor: 'black'
      })
    ctx.restore()
  }
}
