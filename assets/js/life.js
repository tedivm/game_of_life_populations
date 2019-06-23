
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Simple wrapper around randomColor
function randomCellColor() {
  return randomColor({
     luminosity: 'bright',
     format: 'hsl'
  });
}

const hsl_regex = /hsl\(\s*(\d{1,3}),\s*(\d{1,2}\.?\d*)%,\s*(\d{1,2}\.?\d*)%\s*\)/
function getHSL(str){
  var match = str.match(hsl_regex);
  return match ? {
    hue: match[1],
    saturation: match[2],
    lightness: match[3]
  } : {};
}


const possible_modes = ['majority', 'blend', 'random', 'mono']

class Life {
  constructor(canvas, size, opts) {
    this.opts = Object.assign({
      "sleep": 100,
      "print": false,
      "min_pop": 0.05,
      "start_pop": 0.35,
      "max_generations": false,
      "persist_colors": null,
      "mode": false
    }, opts);
    this.pause = false
    this.canvas = canvas
    this.size = size
    this.mode = false
    this.persist_colors = true
    this.offgrid = 10
    this.mono = randomCellColor()
    this.resize()
  }

  resize() {
    this.rows = Math.floor(this.canvas.offsetHeight/this.size) + (this.offgrid*2)
    this.columns = Math.floor(this.canvas.offsetWidth/this.size) + (this.offgrid*2)
  }

  getGrid() {
    if(!this.grid) {
      this.generateRandomGrid()
    }
    return this.grid
  }

  countNeighbors(x, y) {
    var amount = 0;
    var cells = this.grid
    function _isFilled(x, y) {
        return cells[x] && cells[x][y];
    }

    if (_isFilled(x-1, y-1)) amount++;
    if (_isFilled(x,   y-1)) amount++;
    if (_isFilled(x+1, y-1)) amount++;
    if (_isFilled(x-1, y  )) amount++;
    if (_isFilled(x+1, y  )) amount++;
    if (_isFilled(x-1, y+1)) amount++;
    if (_isFilled(x,   y+1)) amount++;
    if (_isFilled(x+1, y+1)) amount++;


    return amount;
  }

  steps(num=1) {
    for(var x = 0; x < num; x++) {
      this.step()
    }
  }

  step() {
    var result = [];
    var grid = this.getGrid()
    const that = this
    /**
     * Return amount of alive neighbors for a cell
     */
    function _countNeighbours(x, y) {
      var amount = 0;

      function _isFilled(x, y) {
        return grid[x] && grid[x][y];
      }

      if (_isFilled(x-1, y-1)) amount++;
      if (_isFilled(x,   y-1)) amount++;
      if (_isFilled(x+1, y-1)) amount++;
      if (_isFilled(x-1, y  )) amount++;
      if (_isFilled(x+1, y  )) amount++;
      if (_isFilled(x-1, y+1)) amount++;
      if (_isFilled(x,   y+1)) amount++;
      if (_isFilled(x+1, y+1)) amount++;

      return amount;
    }

    function _getNeighboringColors(x, y) {
      const colors = {};

      for (let i = -1; i < 2; i++) {
        if (!grid[x+i]) {
          continue;
        }
        for (let j = -1; j < 2; j++) {
          if (grid[x+i][y+j]) {
            const color = grid[x+i][y+j];
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

    function _getPredominentColor(x, y) {
      const colors = _getNeighboringColors(x, y);
      let best = []
      let best_count = 0
      for (const color in colors) {
        if (colors[color] > best_count) {
          best = [color]
          best_count = colors[color]
        } else if (colors[color] == best_count) {
          best.push(color)
        }
      }
      if (best.length < 1) {
        return randomCellColor()
      }

      return best[Math.floor(Math.random() * best.length)];
    }

    function _getColorBlend(x, y) {
      const colors = _getNeighboringColors(x, y);

      const color_code = {
        h: 0,
        s: 0,
        l: 0
      }

      let total = 0

      for (const color in colors) {
        let rgb = getHSL(color)
        color_code['h'] += rgb['hue'] * colors[color]
        color_code['s'] += rgb['saturation'] * colors[color]
        color_code['l'] += rgb['lightness'] * colors[color]
        total += colors[color]
      }

      color_code.h = Math.round(color_code.h/total);
      color_code.s = Math.round(color_code.s/total);
      color_code.l = Math.round(color_code.l/total);

      return `hsl(${color_code.h}, ${color_code.s}%, ${color_code.l}%)`
    }

    function _getNewColor(x, y, mode) {
      switch (mode) {
        case 'majority':
          return _getPredominentColor(x, y)

        case 'blend':
          return _getColorBlend(x, y)

        case 'random':
          return randomCellColor()

        case 'mono':
          return that.mono

        default:
          return _getPredominentColor(x, y)
      }
    }

    const mode = this.mode
    const persist_colors = this.persist_colors
    grid.forEach(function(row, x) {
        result[x] = [];
        row.forEach(function(cell, y) {
            var alive = 0,
                count = _countNeighbours(x, y);

            if (cell) {
                alive = count === 2 || count === 3 ? 1 : 0;
            } else {
                alive = count === 3 ? 1 : 0;
            }

            if (alive) {
              if (!result[x][y]) {
                if (persist_colors && grid[x][y]) {
                  result[x][y] = grid[x][y]
                } else {
                  result[x][y] = _getNewColor(x, y, mode)
                }
              }
            } else {
              result[x][y] = 0
            }
        });
    });

    this.grid = result;
  }

  generateRandomGrid(population=0.5) {
    var grid = []
    for(var x = 0; x < this.columns; x++) {
      for(var y = 0; y < this.rows; y++) {
        if(!grid[x]) {
          grid[x] = []
        }
        const color = this.mode == "mono" ? this.mono : randomCellColor()
        grid[x][y] = (Math.random() < population) ? color : 0
      }
    }
    this.grid = grid
  }

  loadFromPattern(pattern, center=false) {

    if(center) {
      var center_x = Math.round(this.columns/2)
      var center_y = Math.round(this.rows/2)
      var pattern_halfy = Math.round(pattern.length/2)
      var pattern_halfx = Math.round(pattern[0].length/2)
      var x_start = center_x - pattern_halfx
      var y_start = center_y - pattern_halfy
    } else {
      var x_start = 0
      var y_start = 0
    }

    var grid = []
    for(var x = 0; x < this.columns; x++) {
      grid[x] = []
      for(var y = 0; y < this.rows; y++) {
        var pattern_x = x - x_start
        var pattern_y = y - y_start
        if(pattern_x >= 0 && pattern_y >= 0) {
          if(pattern_y < pattern.length && pattern_x < pattern[pattern_y].length) {
            grid[x][y] = pattern[pattern_y][pattern_x]
            continue
          }
        }
        grid[x][y] = 0
      }
    }

    this.grid = grid

  }

  loadFromString(string) {
    var chunks = string.split(',')
    var grid = []
    var index = 0
    for(var y = 0; y < this.rows; y++) {

      if(!!chunks[y]) {
        var section = parseInt(chunks[y],36).toString(2)
        var offset = this.columns - section.length
      } else {
        var section = ''
        var offset = 0
      }

      var index = 0
      for(var x = 0; x < this.columns; x++) {

        if(!grid[x]) {
          grid[x] = []
        }

        if(offset > index) {
          grid[x][y] = 0
        } else {
          grid[x][y] = !!section[index-offset] && parseInt(section[index-offset]) == 1 ? 1 : 0
        }
        index++
      }
    }

    this.grid = grid
    return
  }

  saveToString() {
    var string = ''
    var grid = this.getGrid()
    for(var y = 0; y < this.rows; y++) {
      var next = ''
      for(var x = 0; x < this.columns; x++) {
        next += grid[x][y] > 0 ? "1" : "0"
      }
      var nextchar = parseInt(next,2).toString(36)
      string += parseInt(next,2).toString(36)
      if(y+1 < this.rows) {
        string += ','
      }
    }
    return string
  }

  draw() {
    var grid = this.getGrid()
    var string = ''
    for(var y = 0; y < this.rows; y++) {
      for(var x = 0; x < this.columns; x++) {
        string += bool(grid[x][y]) ? "1" : "0"
      }
      string += "\n"
    }
    console.log(string)
  }

  draw_canvas() {

    const height = this.canvas.offsetHeight
    const width = this.canvas.offsetWidth

    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    const grid = this.getGrid()
    const offgrid = 2

    const screen_columns = this.columns - (offgrid*2)
    const screen_rows = this.rows - (offgrid*2)

    for(var s_x = 0; s_x < screen_columns; s_x++) {
      let g_x = s_x + offgrid
      if (!grid[g_x]) {
        continue
      }
      for(var s_y = -(offgrid); s_y < screen_rows; s_y++) {
        let g_y = s_y + offgrid
        if (grid[g_x][g_y]) {
          ctx.fillStyle = grid[g_x][g_y];
          ctx.fillRect(s_x*this.size, s_y*this.size, this.size, this.size);
        }
      }
    }
  }

  count () {
    const grid = this.getGrid()
    let count = 0

    for(let x = 0; x < this.columns; x++) {
      if (!grid[x]) {
        continue
      }
      for(let y = 0; y < this.rows; y++) {
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

  adjust (opts=false) {
    if (opts) {
      this.opts = Object.assign(this.opts, opts);
    }
  }

  reset (opts=false) {
    if (opts) {
      this.opts = Object.assign(this.opts, opts);
    }

    if (!this.opts.mode) {
      this.mode = possible_modes[Math.floor(Math.random() * possible_modes.length)];
    } else {
      this.mode = this.opts.mode
    }

    if (typeof this.opts.persist_colors === 'undefined') {
      this.persist_colors = Math.random() >= 0.5
    } else {
      this.persist_colors = this.opts.persist_colors
    }

    this.mono = randomCellColor()
    this.generateRandomGrid(this.opts['start_pop'])
    this.draw_canvas()
  }

  async run (opts={}) {

    console.log(this.opts)

    this.reset()
    if (this.opts.print) {
      this.draw()
    }

    let same_count = 0
    let last_pop = 0

    for (let i = 0; true; i++) {
      await sleep(this.opts['sleep']);

      if (this.pause) {
        continue
      }

      if (this.opts['max_generations'] && this.opts['max_generations'] < i) {
        this.reset()
        continue
      }

      this.step()
      const cur_pop = this.count()
      const max_pop = this.rows * this.columns

      // If population is too low reset the world.
      if (this.opts['min_pop'] > (cur_pop/max_pop)) {
        this.reset()
        continue
      }

      // Detect when population isn't changing. Catches some, but not all, short loops.
      if (cur_pop == last_pop) {
        same_count++
        if (same_count >= this.opts['stale_count']) {
          this.reset()
          continue
        }
      } else {
        same_count = 0
        last_pop = cur_pop
      }

      if (this.opts.print) {
        this.draw()
      }

      this.draw_canvas()
    }
  }

}
