/* MoMath Math Square Behavior
 *
 *      Title: Tile Flip Puzzle
 *      Description: Traverse all tiles to flip the color without backtracking!
 *      Framework: P5
 *      Author: Michael Bishop <mbish2013@gmail.com>
 *      Created: 2018 - July
 *      Status: Dev
 */

import P5Behavior from 'p5beh';
import * as Sensor from 'sensors';
import * as Display from 'display';
import Floor from 'floor';

const pb = new P5Behavior();

var LEVEL_SIZE;
var TILE_SIZE;
var CURRENT_TILE_CONFIG_INDEX;
var IS_ANIMATING_RESET = false;
var RESET_ANIMATION_STATE = null; // 'gameVictory' or 'gameOver'
var RESET_ANIMATION_FRAMES_PLAYED = null;

const DEFAULT_ACTIVE_X_POS = 0;
const DEFAULT_ACTIVE_Y_POS = 0;

var ACTIVE_TILE = null;

// Each entry in this array is an additional array of Tile objects
// Index corresponds to vertical position of tile row.
// Index of underlying array correponds to horizontal position of tile row
var tileRows = [];

function Tile(x, y) {
  this.horizontalPosition = x;
  this.verticalPosition = y;
  this.state = 'uncleared';
}

Tile.prototype.clear = function() {
  this.state = 'cleared';
}

Tile.prototype.unclear = function() {
  this.state = 'uncleared';
}

Tile.prototype.activate = function() {
  this.state = 'active';
  ACTIVE_TILE = this;
}

Tile.prototype.roadblock = function() {
  this.state = 'roadblock';
}

Tile.prototype.victory = function() {
  this.state = 'victory';
}

Tile.prototype.gameOver = function() {
  this.state = 'gameOver';
}

Tile.prototype.getColor = function() {
  if (this.state === 'active') {
    return 'yellow';
  } else if (this.state === 'cleared') {
    return 'red';
  } else if (this.state === 'uncleared') {
    return 'blue';
  } else if (this.state === 'roadblock') {
    return 'magenta';
  } else if (this.state === 'victory') {
    return 'green';
  } else if (this.state === 'gameOver') {
    return 'black';
  }
}

// Function checks if a tile is currently uncleared and adjacent
// to the active tile -- I.E. is a candidate to be flipped.
Tile.prototype.isUnclearedAndAdjacent = function() {
  if (this.state === 'cleared' || this.state === 'roadblock') {
    //Tile is not a valid option.
    return false;
  }

  var activeTileX = ACTIVE_TILE.horizontalPosition;
  var activeTileY = ACTIVE_TILE.verticalPosition;

  var checkedTileX = this.horizontalPosition;
  var checkedTileY = this.verticalPosition;

  var xPositionMatches = activeTileX === checkedTileX;
  var yPositionMatches = activeTileY === checkedTileY;

  if (xPositionMatches && yPositionMatches) {
    // checked is the same as active! abort.
    return false;
  }

  if (xPositionMatches && Math.abs(activeTileY - checkedTileY) === 1) {
    // Vertically adjacent, good to go
    return true;
  }

  if (yPositionMatches && Math.abs(activeTileX - checkedTileX) === 1) {
    // Horizontally adjacent, good to go
    return true;
  }

  // Does not match conditions, return.
  return false;
}

function activeTileHasNoMoves() {
  var activeTileHasOpenAdjacentTile = false;

  var adjacentIndices = [
    {x: 0, y: 1},
    {x: 0, y: -1},
    {x: 1, y: 0},
    {x: -1, y: 0}
  ];

  for (var i = 0; i < adjacentIndices.length; i++) {
    var xIndexToCheck = ACTIVE_TILE.horizontalPosition + adjacentIndices[i].x;
    var yIndexToCheck = ACTIVE_TILE.verticalPosition + adjacentIndices[i].y;

    var tileToCheck = getTileFromIndex(xIndexToCheck, yIndexToCheck);

    if (typeof tileToCheck !== 'undefined' && tileToCheck.isUnclearedAndAdjacent()) {
      activeTileHasOpenAdjacentTile = true;
      break;
    }
  }
  return !activeTileHasOpenAdjacentTile;
}

function allTilesCleared() {
  var unclearedTilesPresent = false;

  for (var i = 0; i < LEVEL_SIZE; i++) {
    // Go through each row of tiles
    var tileRow = tileRows[i];

    for (var k = 0; k < LEVEL_SIZE; k++) {
      if (tileRow[k].state === 'uncleared') {
        unclearedTilesPresent = true;
        break;
      }
    }
  }
  return !unclearedTilesPresent;
}

function generateTiles() {
  // Reset tile object if it already exists
  if (tileRows.length > 0) {
    tileRows = [];
  }

  // x and y coords are initial active tile
  for (var i = 0; i < LEVEL_SIZE; i++) {
    var tileArray = [];
    for (var j = 0; j < LEVEL_SIZE; j++) {
      tileArray.push(new Tile(i, j));
    }
    tileRows.push(tileArray);
  }
}

// Input should be indices from tileRows Array
function getTileFromIndex(x, y) {
  if (typeof tileRows[x] !== 'undefined') {
    return tileRows[x][y];
  }
}

// Input should be raw pixel coordinates from sensors
function getTileFromPixel(x, y) {
  var xIndex = Math.floor(x / TILE_SIZE);
  var yIndex = Math.floor(y / TILE_SIZE);

  return getTileFromIndex(xIndex, yIndex);
}

function loadTileConfig(loadTrigger) {
  // loadTrigger is a string denoting reason for load. Values:
  // 'init' -- initial load state, start with first puzzle
  // 'gameOver' -- user lost, reload the same config
  // 'gameVictory' -- user won, progress to next config

  console.log('loading new tile config due to ' + loadTrigger);

  var configs = [
    {
      'activeTileIndex': [0, 0],
      'roadblockIndices': [1, 0],
      'size': 4,
      'name': 'helloWorld'
    },
    {
      'activeTileIndex': [2, 3],
      'roadblockIndices': [2, 2],
      'size': 5,
      'name': 'spiralPower'
    },
    {
      'activeTileIndex': [0, 5],
      'roadblockIndices': [[1, 2],
                           [4, 2],
                           [1, 3],
                           [4, 3]],
      'size': 6,
      'name': 'aroundTheWorld'
    },
    {
      'activeTileIndex': [2, 6],
      'roadblockIndices': [[1, 1],
                           [2, 1],
                           [3, 1],
                           [4, 1],
                           [5, 1],
                           [2, 2],
                           [2, 3],
                           [2, 4],
                           [2, 5],
                           [4, 2],
                           [4, 3],
                           [4, 4],
                           [4, 5]],
      'size': 7,
      'name': 'deliciousPi'
    }
  ];

  var selectedConfigIndex = 0; // Default to 0 if anything goes wrong, should never be necessary

  if (loadTrigger === 'init') {
    selectedConfigIndex = 0;
  } else if (loadTrigger === 'gameOver') {
    // Reload current config
    selectedConfigIndex = CURRENT_TILE_CONFIG_INDEX;
  } else if (loadTrigger === 'gameVictory') {
    if (CURRENT_TILE_CONFIG_INDEX === (configs.length - 1)) {
      selectedConfigIndex = 0; // reset to first config after all are done
    } else {
      selectedConfigIndex = CURRENT_TILE_CONFIG_INDEX + 1;
    }
  }

  var selectedConfig = configs[selectedConfigIndex];
  CURRENT_TILE_CONFIG_INDEX = selectedConfigIndex;

  var activeTileIndex = selectedConfig.activeTileIndex;
  var roadblockIndices = selectedConfig.roadblockIndices;
  LEVEL_SIZE = selectedConfig.size;
  TILE_SIZE = Display.width / LEVEL_SIZE; // Display must be square

  generateTiles();

  var tileToActivate = getTileFromIndex(activeTileIndex[0], activeTileIndex[1]);
  if (typeof tileToActivate !== 'undefined') {
    tileToActivate.activate();
  }

  if (typeof roadblockIndices[0] === 'number') {
    // Only one roadblock
    var tileToRoadblock = getTileFromIndex(roadblockIndices[0], roadblockIndices[1]);
    if (typeof tileToRoadblock !== 'undefined') {
      tileToRoadblock.roadblock();
    }
  } else if (typeof roadblockIndices[0] === 'object') {
    // Array of arrays, multiple roadblocks
    var len = roadblockIndices.length;
    for (var i = 0; i < len; i++) {
      var roadblockIndex = roadblockIndices[i];
      var tileToRoadblock = getTileFromIndex(roadblockIndex[0], roadblockIndex[1]);

      if (typeof tileToRoadblock !== 'undefined') {
        tileToRoadblock.roadblock();
      }
    }
  }
  console.log('Loading tile config of ' + selectedConfig.name + '!');
}

pb.preload = function (p) {
  /* this == pb.p5 == p */
  console.log('preloading');
}

pb.setup = function (p) {
  console.log('running setup');
  loadTileConfig('init');
}

pb.draw = function (floor, p) {
  if (IS_ANIMATING_RESET) {
    // Override game logic and standard painting if playing victory/loss animation

    if (RESET_ANIMATION_FRAMES_PLAYED === 25) {
      // End reset animation and resume game
      IS_ANIMATING_RESET = false;
      RESET_ANIMATION_FRAMES_PLAYED = null;
      loadTileConfig(RESET_ANIMATION_STATE);

      RESET_ANIMATION_STATE = null;
    } else {
      // Playing reset animation
      if (RESET_ANIMATION_FRAMES_PLAYED === 0) {
        if (RESET_ANIMATION_STATE === 'gameVictory') {
          ACTIVE_TILE.victory();
        } else if (RESET_ANIMATION_STATE === 'gameOver') {
          ACTIVE_TILE.gameOver();
        }
      } else {
        var initPropagationX = ACTIVE_TILE.horizontalPosition;
        var initPropagationY = ACTIVE_TILE.verticalPosition;
        var propagationOffset = RESET_ANIMATION_FRAMES_PLAYED;
        var progress = 0;
        var tileIndicesToAnimate = [];

        function pushFactory(x, y) {
          tileIndicesToAnimate.push([x, y]);
        }

        while (progress < RESET_ANIMATION_FRAMES_PLAYED) {
          for (var i = 0; i < RESET_ANIMATION_FRAMES_PLAYED; i++) {
            pushFactory(initPropagationX + progress, initPropagationY + progress + i);
            pushFactory(initPropagationX + progress, initPropagationY + progress - i);
            pushFactory(initPropagationX + progress + i, initPropagationY + progress);
            pushFactory(initPropagationX + progress - i, initPropagationY + progress);
          }

          for (var i = 0; i < RESET_ANIMATION_FRAMES_PLAYED; i++) {
            pushFactory(initPropagationX + progress, initPropagationY - progress + i);
            pushFactory(initPropagationX + progress, initPropagationY - progress - i);
            pushFactory(initPropagationX + progress + i, initPropagationY - progress);
            pushFactory(initPropagationX + progress - i, initPropagationY - progress);
          }

          for (var i = 0; i < RESET_ANIMATION_FRAMES_PLAYED; i++) {
            pushFactory(initPropagationX - progress, initPropagationY + progress + i);
            pushFactory(initPropagationX - progress, initPropagationY + progress - i);
            pushFactory(initPropagationX - progress + i, initPropagationY + progress);
            pushFactory(initPropagationX - progress - i, initPropagationY + progress);
          }

          for (var i = 0; i < RESET_ANIMATION_FRAMES_PLAYED; i++) {
            pushFactory(initPropagationX - progress, initPropagationY - progress + i);
            pushFactory(initPropagationX - progress, initPropagationY - progress - i);
            pushFactory(initPropagationX - progress + i, initPropagationY - progress);
            pushFactory(initPropagationX - progress - i, initPropagationY - progress);
          }
          progress++;
        }

        for (var l = 0; l < tileIndicesToAnimate.length; l++) {
          var tileToAnimate = getTileFromIndex(tileIndicesToAnimate[l][0], tileIndicesToAnimate[l][1]);
          if (typeof tileToAnimate !== 'undefined') {
            if (RESET_ANIMATION_STATE === 'gameVictory') {
              tileToAnimate.victory();
            } else if (RESET_ANIMATION_STATE === 'gameOver') {
              tileToAnimate.gameOver();
            }
          }
        }
      }
      RESET_ANIMATION_FRAMES_PLAYED += 1;
    }

    paintTiles();
    return;
  }

  // Check for dead end (game over) and all clear (success)
  var gameVictory = allTilesCleared();
  var gameOver = activeTileHasNoMoves();
  var shouldReset = false;
  var reasonForReset = false;

  if (gameVictory) {
    shouldReset = true;
    reasonForReset = 'gameVictory';
  } else if (gameOver) {
    shouldReset = true;
    reasonForReset = 'gameOver';
  }

  if (!shouldReset) { // No point updating user data if game is over
    for (var j = 0; j < floor.users.length; j++) {
      var user = floor.users[j];

      var userTile = getTileFromPixel(user.x, user.y);
      if (userTile.isUnclearedAndAdjacent()) {
        ACTIVE_TILE.clear();
        userTile.activate();
        break; // Only one update per draw
      }
    }
  }

  paintTiles();

  function paintTiles() {
    for (var i = 0; i < LEVEL_SIZE; i++) {
      // Go through each row of tiles
      var tileRow = tileRows[i];

      for (var k = 0; k < LEVEL_SIZE; k++) {
        var tile = tileRow[k];

        // Paint tile
        var color = tile.getColor();
        var xCoordinate = i * TILE_SIZE;
        var yCoordinate = k * TILE_SIZE;
        p.fill(color);
        p.rect(xCoordinate, yCoordinate, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  if (shouldReset) {
    IS_ANIMATING_RESET = true;
    RESET_ANIMATION_STATE = reasonForReset;
    RESET_ANIMATION_FRAMES_PLAYED = 0;
  }
};

export const behavior = {
  title: "Flip the Tiles",
  init: pb.init.bind(pb),
  frameRate: 'sensor',
  render: pb.render.bind(pb)
};
export default behavior
