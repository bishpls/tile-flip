# tile-flip

Project Category -- Math Square (https://github.com/momath/math-square)

The Math

I wanted to explore the gamification of spatial reasoning via solving a simple traversal puzzle, covering all traversal options with no backtracking of steps.

The Submission

The goal of the game is to turn all of the blue tiles to red by stepping on them! You start on the yellow square, and move to any adjacent square that isn't blocked (magenta) or already cleared (red.) When the user moves to an uncleared tile, that becomes the active (yellow) tile and the former active tile is cleared (turns red.)

If there are no valid moves left (I.E. there are no squares you can move to from the yellow square) the game will reset the current level.

If all clearable tiles have been cleared, the game will progress to the next level. 

If all four levels are cleared, the game will reload the first level. 

The target audience for this game is younger kids; I wanted to present a puzzle that progressed in difficulty, beginning simply and progressing to be more complicated. Ideally, this will introduce the concept of spatial mapping and evaluating how to fill space given restrictions (I.E. the blocking magenta squares).

![equation](https://github.com/bishpls/tile-flip/blob/master/example.png)
