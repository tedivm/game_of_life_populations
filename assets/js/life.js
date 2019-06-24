
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
  return Math.floor(Math.random() * Math.floor(max - min)) + min
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

const possibleModes = ['majority', 'blend', 'blend_linear', 'density', 'mono']

class Life {
  constructor (canvas, size, opts) {
    this.opts = Object.assign({
      'sleep': 100,
      'print': false,
      'min_pop': 0.05,
      'start_pop': 0.35,
      'max_generations': false,
      'persistColors': null,
      'mode': false
    }, opts)
    this.pause = false
    this.canvas = canvas
    this.size = size
    this.mode = false
    this.persistColors = true
    this.offgrid = 10
    this.mono = randomCellColor()
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

    function _getColorBlend (x, y) {
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

    function _getColorBlendLinear (x, y) {
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
        that.runtime.density_offset = randomInt(15, 120)
      }
      if (!that.runtime.range) {
        that.runtime.range = randomInt(2, 5)
      }

      if (!that.runtime.direction) {
        that.runtime.direction = randomInt(1, 2)
      }

      const maxDensity = (((that.runtime.range * 2) + 1) ** 2) - 1
      const neighbors = _countNeighbors(x, y, that.runtime.range)
      let density = (neighbors / maxDensity)
      if (that.runtime.direction === 1) {
        density = 1.0 - density
      }

      const h = (density * 240) + that.runtime.density_offset
      return 'hsl(' + h + ', 100%, 50%)'
    }

    function _getNewColor (x, y) {
      switch (that.mode) {
        case 'majority':
          if (that.persistColors && _isFilled(x, y)) return grid[x][y]
          return _getPredominentColor(x, y)

        case 'blend':
          if (that.persistColors && _isFilled(x, y)) return grid[x][y]
          return _getColorBlend(x, y)

        case 'blend_linear':
          if (that.persistColors && _isFilled(x, y)) return grid[x][y]
          return _getColorBlendLinear(x, y)

        case 'random':
          if (that.persistColors && _isFilled(x, y)) return grid[x][y]
          return randomCellColor()

        case 'mono':
          return that.mono

        case 'density':
          return _getColorDensity(x, y)

        default:
          if (that.persistColors && _isFilled(x, y)) return grid[x][y]
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
    var grid = []
    for (var x = 0; x < this.columns; x++) {
      for (var y = 0; y < this.rows; y++) {
        if (!grid[x]) {
          grid[x] = []
        }
        const color = this.mode === 'mono' ? this.mono : randomCellColor()
        grid[x][y] = (Math.random() < population) ? color : 0
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

    this.generation = 0

    if (!this.opts.mode) {
      this.mode = possibleModes[Math.floor(Math.random() * possibleModes.length)]
    } else {
      this.mode = this.opts.mode
    }

    if (typeof this.opts.persistColors === 'undefined') {
      this.persistColors = Math.random() >= 0.5
    } else {
      this.persistColors = this.opts.persistColors
    }

    this.mono = randomCellColor()
    this.generateRandomGrid(this.opts['start_pop'])
    this.drawCanvas()
  }

  async run (opts = {}) {
    console.log(this.opts)

    this.reset()
    if (this.opts.print) {
      this.draw()
    }

    let sameCount = 0
    let lastPop = 0

    for (; true; this.generation++) {
      await sleep(this.opts['sleep'])

      if (this.pause) {
        continue
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
