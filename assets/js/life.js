
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

function randomInt (min, max) {
  return Math.floor(Math.random() * Math.floor((max + 1) - min)) + min
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

const possibleModes = ['majority', 'blend_wheel', 'blend_spectrum', 'density', 'mono']

class Life {
  constructor (canvas, size, opts) {
    this.opts = Object.assign({
      'sleep': 100,
      'print': false,
      'min_pop': 0.05,
      'start_pop': 0.35,
      'max_generations': false,
      'persistColors': null,
      'mode': false,
      'onReset': false,
      'minSleep': 5
    }, opts)
    this.pause = false
    this.increment = false
    this.canvas = canvas
    this.size = size
    this.activeMode = false
    this.offgrid = 10
    this.resize()
  }

  resize () {
    this.rows = Math.floor(this.canvas.offsetHeight / this.size) + (this.offgrid * 2)
    this.columns = Math.floor(this.canvas.offsetWidth / this.size) + (this.offgrid * 2)
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

      colorCode.h = Math.round(colorCode.h / total)
      colorCode.s = Math.round(colorCode.s / total)
      colorCode.l = Math.round(colorCode.l / total)

      return `hsl(${colorCode.h}, ${colorCode.s}%, ${colorCode.l}%)`
    }

    function _getColorDensity (x, y) {
      if (!that.runtime.density_offset) {
        that.runtime.density_offset = randomInt(50, 120)
      }
      if (!that.runtime.range) {
        that.runtime.range = randomInt(2, 5)
      }

      if (!that.runtime.direction) {
        that.runtime.direction = randomInt(1, 2)
      }

      const maxDensity = ((((that.runtime.range * 2) + 1) ** 2) - 1) * 0.6
      const neighbors = _countNeighbors(x, y, that.runtime.range)
      let density = Math.min((neighbors / maxDensity), 1)
      if (that.runtime.direction === 1) {
        density = 1.0 - density
      }

      const h = (density * 240) + that.runtime.density_offset
      return 'hsl(' + h + ', 100%, 50%)'
    }

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

        case 'mono':
          if (!that.runtime.mono) {
            that.runtime.mono = randomCellColor()
          }
          return that.runtime.mono

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
    function getSpectrumColor (x, y) {
      let hue = (x / that.columns) * 360
      let lightness = ((y / that.rows) * 50) + 40
      return `hsl(${hue}, 100%, ${lightness}%)`
    }

    const spectrum = Math.random() < 0.2

    var grid = []
    for (var x = 0; x < this.columns; x++) {
      for (var y = 0; y < this.rows; y++) {
        if (!grid[x]) grid[x] = []
        if (Math.random() > population) {
          grid[x][y] = 0
          continue
        }
        if (this.activeMode === 'mono' || this.activeMode === 'density') {
          grid[x][y] = 'hsl(0, 0%, 100%)' // white
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
    ctx.clearRect(0, 0, width, height)

    const grid = this.getGrid()
    const offgrid = 2

    const screenColumns = this.columns - (offgrid * 2)
    const screenRows = this.rows - (offgrid * 2)

    for (var sX = 0; sX < screenColumns; sX++) {
      let gX = sX + offgrid
      if (!grid[gX]) {
        continue
      }
      for (var sY = -(offgrid); sY < screenRows; sY++) {
        let gY = sY + offgrid
        if (grid[gX][gY]) {
          ctx.fillStyle = grid[gX][gY]
          ctx.fillRect(sX * this.size, sY * this.size, this.size, this.size)
        }
      }
    }
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

    this.runtime = {}

    this.generation = 1

    if (Math.random() < 0.25) {
      this.runtime.mutationRate = Math.random() * 0.10
    } else {
      this.runtime.mutationRate = 0
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
    let lastRun = (new Date()).getTime()
    for (; true; this.generation++) {
      let now = (new Date()).getTime()
      let sleepTime = Math.max(this.opts['sleep'] - (now - lastRun), this.opts['minSleep'])
      await sleep(sleepTime)
      lastRun = (new Date()).getTime()

      if (this.pause) {
        continue
      }

      if (this.increment) {
        this.increment = false
        this.pause = true
      }

      if (this.opts['max_generations'] && this.opts['max_generations'] <= this.generation) {
        this.reset()
        continue
      }

      this.step()
      const curPop = this.count()
      const maxPop = this.rows * this.columns

      // If population is too low reset the world.
      if (this.opts['min_pop'] > (curPop / maxPop)) {
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

      this.drawCanvas()
    }
  }
}
