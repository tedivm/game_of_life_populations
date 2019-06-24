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

For all modes other than the original there are three different additions.

* **Color Logic** is unique to each mode and defines how cells are assigned colors.
* **Persistence** defines whether existing cells keep their color or have them recalculated.
* **Mutation** adds an additional step to the color logic that gives a small number of cells a random color.


| Modes          | Color Logic | Persistence | Mutation |
|----------------|-------------|-------------|----------|
| Monochrome     |             |             |          |
| Majority       | ✓           | ✓           | ✓        |
| Blend Wheel    | ✓           | ✓           | ✓        |
| Blend Spectrum | ✓           | ✓           | ✓        |
| Density        | ✓           |             |          |
| Random         | ✓           | ✓           |          |

Both **Persistence** and **Mutation** are optional features that get toggled randomly when new worlds are generated.


### Monochrome/Original

This is the original version of Conway's Game of Life. The color of the cells are all the same, and that value is selected randomly when a new world is generated.


### Majority (aka "Immigration Game")

When cells are given colors they take on the color of the majority of their neighbors. If there is a tie then a random color is selected from the tied values.


### Blend Wheel

When cells are given colors they take on average color of their neighbors. This value is calculated on a color wheel.


### Blend Spectrum

When cells are given colors they take on average color of their neighbors. This value is calculated on a color spectrum, and as a result it loses the extreme ends of the spetrum quickly and tends to move towards the center of the spectrum over time.


### Density

Cell colors are based on the population density surrounding the cell.


### Random

Cell colors are assigned at random.
