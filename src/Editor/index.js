import { MIN_SCALE, MAX_SCALE } from "../cfg";

import { roundTo } from "../math";

import Tile from "./Tile/index";

/**
 * @class Editor
 */
class Editor {

  /**
   * @param {Picaxo} instance
   */
  constructor(instance) {
    this.modes = {
      draw: false,
      drag: false
    };
    this.batches = {
      tiles: []
    };
    this.colorTest = null;
    this.camera = instance.camera;
    this.commander = instance.commander;
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @param {Boolean} state
   */
  select(x, y, state) {
    this.modes.drag = state;
    this.modes.draw = !!state;
    if (state && this.modes.draw) {
      this.colorTest = this.setRandomColor();
      this.pushTileBatchOperation();
      this.pushTileBatch(x, y);
      this.clearLatestTileBatch();
    }
  }

  /**
   * Clear latest batch operation if empty
   */
  clearLatestTileBatch() {
    let batch = this.getLatestTileBatchOperation();
    // latest batch operation is empty, remove so 
    if (batch.length <= 0) {
      let offset = this.batches.tiles.length - 1;
      this.batches.tiles.splice(offset, 1);
    }
  }

  /**
   * @return {Array}
   */
  setRandomColor() {
    let r = ((Math.random() * 255) + 1) | 0;
    let g = ((Math.random() * 255) + 1) | 0;
    let b = ((Math.random() * 255) + 1) | 0;
    return ([r, g, b, 1]);
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @return {Object}
   */
  getRelativeOffset(x, y) {
    let pos = this.camera.getRelativeOffset(x, y);
    pos.x = roundTo(pos.x - 4, 8);
    pos.y = roundTo(pos.y - 4, 8);
    return (pos);
  }

  /**
   * @param {Number} x
   * @param {Number} y
   */
  createTileByMouseOffset(x, y) {
    let position = this.getRelativeOffset(x, y);
    let tile = new Tile();
    tile.x = position.x;
    tile.y = position.y;
    return (tile);
  }

  /**
   * @return {Array}
   */
  getLatestTileBatchOperation() {
    let offset = this.batches.tiles.length - 1;
    let batch = this.batches.tiles;
    return (batch[offset]);
  }

  /**
   * Push in a new batch operation
   */
  pushTileBatchOperation() {
    let operation = [];
    this.batches.tiles.push(operation);
    this.commander.push({
      operation
    });
  }

  /**
   * Clear earlier tile at given position
   * ==> update its color and old color value
   * @param {Number} x
   * @param {Number} y
   * @return {Number}
   */
  getTileFromMouseOffset(x, y) {
    let position = this.getRelativeOffset(x, y);
    let tile = this.findTileAt(position.x, position.y);
    return (tile);
  }

  /**
   * Collect all tiles at given relative position
   * @param {Number} x
   * @param {Number} y
   * @return {Tile}
   */
  findTileAt(x, y) {
    let target = null;
    let batches = this.batches.tiles;
    for (let ii = 0; ii < batches.length; ++ii) {
      let batch = batches[ii];
      for (let jj = 0; jj < batch.length; ++jj) {
        let tile = batch[jj];
        if (tile.x === x && tile.y === y) {
          target = tile;
        }
      };
    };
    return (target);
  }

  /**
   * Create, push and batch a new tile at x,y
   * @param {Number} x
   * @param {Number} y
   */
  pushTileBatch(x, y) {
    let otile = this.getTileFromMouseOffset(x, y);
    let tile = this.createTileByMouseOffset(x, y);
    let color = [
      this.colorTest[0],
      this.colorTest[1],
      this.colorTest[2],
      this.colorTest[3]
    ];
    // previous tile found, update it
    if (otile !== null) {
      // check if we have to overwrite the old tiles color
      // e.g => push in a new color state
      let matches = this.colorArraysMatch(
        color,
        otile.colors[otile.cindex]
      );
      // old and new colors doesnt match, insert new color values
      // into the old tile's color array to save its earlier state
      if (!matches) {
        otile.colors.unshift(color);
      }
    // if no tile found, push it into the batch
    } else {
      let batch = this.getLatestTileBatchOperation();
      tile.colors.push(color);
      batch.push(tile);
    }
  }

  /**
   * Compare two color arrays if they match both
   * @param {Array} a
   * @param {Array} b
   * @return {Boolean}
   */
  colorArraysMatch(a, b) {
    return (
      a[0] === b[0] &&
      a[1] === b[1] &&
      a[2] === b[2] &&
      a[3] === b[3]
    );
  }

  /**
   * @param {Number} x
   * @param {Number} y
   */
  drag(x, y) {
    if (this.modes.drag) {
      if (this.modes.draw) {
        this.pushTileBatch(x, y);
      }
    }
  }

  /**
   * @param {Number} x
   * @param {Number} y
   */
  hover(x, y) {
    //console.log("Hover", x, y);
  }

};

export default Editor;