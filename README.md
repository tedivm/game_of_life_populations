## tedivm's Game of Life

Life should be colorful, and that's what this version of [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life) brings.

See it [in action](https://life.tedivm.com/)!

## Controls

* Reset - Enter Key
* Speed - Up/Down Keys
* Pause/Unpause - Spacebar
* Increment Generation - Right Arrow Key
* Debug Info (to console) - D Key
* Shrink/Grow cell size- S and G Keys


## Modes

All modes follow the original rules of Conway's Game of Life to define whether a cell lives, dies, or is created.

Ther are also a variety of rules on how colors are assigned.

* **Color Logic** is unique to each mode and defines how cells are assigned colors.
* **Persistence** defines whether existing cells keep their color or have them recalculated.
* **Mutation** adds an additional step to the color logic that gives a small number of cells a random color.
* **Spectrum** initializes the grid with a gradient of color rather than randomly.

| Modes          | Color Logic | Persistence\* | Mutation\* | Spectrum\* |
|----------------|-------------|---------------|------------|------------|
| Monochrome     |             |               |            |            |
| Majority       | ✓           | ✓             | ✓          | ✓          |
| Blend Wheel    | ✓           | ✓             | ✓          | ✓          |
| Blend Spectrum | ✓           | ✓             | ✓          | ✓          |
| Density        | ✓           |               |            |            |
| Generation     | ✓           | ✓             |            | ✓          |
| Random         | ✓           | ✓             |            |            |


\* These modes are optional and will be randomly toggled on at the start of each run.


### Original

This is the original version of Conway's Game of Life. The color of the cells are all the same, and that value is selected randomly when a new world is generated.


### Majority

When cells are given colors they take on the color of the majority of their neighbors. If there is a tie then a random color is selected from the tied values.


### Blend Wheel

When cells are given colors they take on average color of their neighbors. This value is calculated on a color wheel.


### Blend Spectrum

When cells are given colors they take on average color of their neighbors. This value is calculated on a color spectrum, and as a result it loses the extreme ends of the spetrum quickly and tends to move towards the center of the spectrum over time.


### Density

Cell colors are based on the population density surrounding the cell.


### Generation

Each generation is assigned a specific color. Most of the time this uses a color spectrum, so that each generation is subtlety different than the previous one. Other runs it assigns each generation a random color.


### Random

Cell colors are assigned at random.
