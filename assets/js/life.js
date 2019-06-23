
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Simple wrapper around randomColor
function randomCellColor() {
  return randomColor({
     luminosity: 'bright',
     format: 'rgb'
  });
}

class Life {
  constructor(canvas, size, offgrid=10) {
    this.canvas = canvas
    this.size = size
    this.offgrid = offgrid
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

    function _getPredominentColor(x, y) {
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
                result[x][y] = _getPredominentColor(x, y)
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
        grid[x][y] = (Math.random() < population) ? randomCellColor() : 0
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

    for(var x = -(offgrid); x < this.columns-offgrid; x++) {
      if (x < 0 || !grid[x]) {
        continue
      }
      for(var y = -(offgrid); y < this.rows-offgrid; y++) {
        if (y < 0) {
          continue
        }
        if (grid[x][y]) {
          ctx.fillStyle = grid[x][y];
          ctx.fillRect(x*this.size, y*this.size, this.size, this.size);
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

  async run (opts={}) {

    opts = Object.assign({
      "sleep": 100,
      "print": false,
      "min_pop": 0.05,
      "start_pop": 0.35
    }, opts);

    console.log(opts)
    this.generateRandomGrid(opts['start_pop'])
    this.draw_canvas()
    if (opts.print) {
      this.draw()
    }

    let same_count = 0
    let last_pop = 0

    while(true) {
      await sleep(opts['sleep']);
      this.step()
      const cur_pop = this.count()
      const max_pop = this.rows * this.columns

      // If population is too low reset the world.
      if (opts['min_pop'] > (cur_pop/max_pop)) {
        this.generateRandomGrid(opts['start_pop'])
      }

      // Detect when population isn't changing. Catches some, but not all, short loops.
      if (cur_pop == last_pop) {
        same_count++
        if (same_count >= opts['stale_count']) {
          this.generateRandomGrid(opts['start_pop'])
        }
      } else {
        same_count = 0
        last_pop = cur_pop
      }

      if (opts.print) {
        this.draw()
      }

      this.draw_canvas()
    }
  }

}
