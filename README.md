## tedivm's Game of Life

Life should be colorful, and that's what this version of [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life) brings.


## Controls

* Reset - Enter Key
* Speed - Up/Down Keys
* Pause/Unpause - Spacebar
* Increment Generation - Right Arrow Key
* Debug Info (to console) - D Key


## Modes

All modes follow the original rules of Conway's Game of Life to define whether a cell lives, dies, or is created.

Modes that have multiple colors add their own rules for defining those colors.


### Monochrome/Original

This is the original version of Conway's Game of Life. The color of the cells are all the same, and that value is selected randomly when a new world is generated.


### Majority (aka "Immigration Game")

Each cell is initialized with a random color.

When new cells are created they take on the color of the majority of their neighbors. If there is a tie then a random color is selected from the tied values.

Existing cells default to keeping their colors each step. There is a variant of this mode where those colors are instead recalculated each step.


### Blend Wheel

Each cell is initialized with a random color.

When new cells are created they take on average color of their neighbors. This value is calculated on a color wheel.

Existing cells default to keeping their colors each step. There is a variant of this mode where those colors are instead recalculated each step.


### Blend Spectrum

Each cell is initialized with a random color.

When new cells are created they take on average color of their neighbors. This value is calculated on a color spectrum, and as a result it loses the extreme ends of the spetrum quickly and tends to move towards the center of the spectrum over time.

Existing cells default to keeping their colors each step. There is a variant of this mode where those colors are instead recalculated each step.
