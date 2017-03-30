import {
  SETTINGS,
  MAX_SAFE_INTEGER
} from "../cfg";

import {
  colorToRgbaString,
  alphaByteToRgbAlpha
} from "../color";

import Batch from "../batch/index";
import CommandKind from "../stack/kind";

/**
 * @return {String}
 */
export function exportAsDataUrl() {
  if (!(this.main.buffer instanceof CanvasRenderingContext2D)) return ("");
  const buffer = this.main.buffer;
  const view = buffer.canvas;
  return (view.toDataURL("image/png"));
};

/**
 * Access raw pixel
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
export function getPixelAt(x, y) {
  // normalize coordinates
  const xx = x - this.bounds.x;
  const yy = y - this.bounds.y;
  if (this.bounds.w <= 0 && this.bounds.h <= 0) return (null);
  // now extract the data
  const data = this.main.data;
  // imagedata array is 1d
  const idx = (yy * this.bounds.w + xx) * 4;
  // pixel index out of bounds
  if (idx < 0 || idx >= data.length) return (null);
  // get each color value
  const r = data[idx + 0];
  const g = data[idx + 1];
  const b = data[idx + 2];
  const a = data[idx + 3];
  const color = [r, g, b, alphaByteToRgbAlpha(a)];
  // dont return anything if we got no valid color
  if (a <= 0) return (null);
  // finally return the color array
  return (color);
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Layer}
 */
export function getLayerByPoint(x, y) {
  const layers = this.layers;
  for (let ii = 0; ii < layers.length; ++ii) {
    const idx = layers.length - 1 - ii;
    const layer = layers[idx];
    if (layer.bounds.isPointInside(x, y)) return (layer);
  };
  return (null);
};

/**
 * @param {Number} id
 * @return {Batch}
 */
export function getBatchById(id) {
  let result = null;
  const layers = this.layers;
  for (let ii = 0; ii < layers.length; ++ii) {
    const idx = layers.length - 1 - ii;
    const layer = layers[idx];
    let batch = layer.getBatchById(id);
    if (batch !== null) {
      result = batch;
      break;
    }
  };
  return (result);
};

/**
 * @return {Layer}
 */
export function getCurrentLayer() {
  if (this.layers.length) {
    return (this.layers[this.layers.length - 1]);
  }
  return (null);
};

/**
 * Get batch to insert at by current active state
 * @return {Batch}
 */
export function getCurrentDrawingBatch() {
  for (let key in this.states) {
    const state = this.states[key];
    if (state === true && this.buffers[key]) {
      return (this.buffers[key]);
    }
  };
  return (null);
};

/**
 * @return {Batch}
 */
export function createDynamicBatch() {
  const batch = new Batch(this);
  return (batch);
};

export function refreshMainTexture() {
  this.createMainBuffer();
};

/**
 * @return {Boolean}
 */
export function workingAreaHasResized() {
  const ox = this.bounds.x; const oy = this.bounds.y;
  const ow = this.bounds.w; const oh = this.bounds.h;
  const nx = this.last.gx; const ny = this.last.gy;
  const nw = this.last.gw; const nh = this.last.gh;
  return (
    ox !== nx || oy !== ny ||
    ow !== nw || oh !== nh
  );
};

export function updateGlobalBoundings() {
  for (let ii = 0; ii < this.layers.length; ++ii) {
    this.layers[ii].updateBoundings();
  };
  const bounds = this.bounds;
  let x = MAX_SAFE_INTEGER; let y = MAX_SAFE_INTEGER;
  let w = -MAX_SAFE_INTEGER; let h = -MAX_SAFE_INTEGER;
  const layers = this.layers;
  for (let ii = 0; ii < layers.length; ++ii) {
    const layer = layers[ii];
    const bounds = layer.bounds;
    const bx = bounds.x; const by = bounds.y;
    const bw = bx + bounds.w; const bh = by + bounds.h;
    // ignore empty layers
    if (bounds.w === 0 && bounds.h === 0) continue;
    // calculate x
    if (x < 0 && bx < x) x = bx;
    else if (x >= 0 && (bx < 0 || bx < x)) x = bx;
    // calculate y
    if (y < 0 && by < y) y = by;
    else if (y >= 0 && (by < 0 || by < y)) y = by;
    // calculate width
    if (bw > w) w = bw;
    // calculate height
    if (bh > h) h = bh;
  };
  this.last.gx = bounds.x; this.last.gy = bounds.y;
  this.last.gw = bounds.w; this.last.gh = bounds.h;
  // update our boundings
  this.bounds.update(x, y, -x + w, -y + h);
};

/**
 * Uses preallocated binary grid with the size of the absolute boundings
 * of our working area. In the next step we trace "alive cells" in the grid,
 * then we take the boundings of the used area of our grid and crop out
 * the relevant part. Next we can process each tile=^2 traced as inside shape
 * @param {Number} x
 * @param {Number} y
 * @param {Array} base
 * @return {Object}
 */
export function getBinaryShape(x, y, base) {
  const bounds = this.bounds;
  const bx = bounds.x;
  const by = bounds.y;
  const gw = bounds.w;
  const gh = bounds.h;
  const isEmpty = base[3] === 0;
  const gridl = gw * gh;

  // allocate and do a basic fill onto the grid
  let grid = new Uint8ClampedArray(gw * gh);
  for (let ii = 0; ii < gridl; ++ii) {
    const xx = ii % gw;
    const yy = (ii / gw) | 0;
    const color = this.getPixelAt(bx + xx, by + yy);
    // empty tile based
    if (isEmpty) { if (color !== null) continue; }
    // color based
    else {
      if (color === null) continue;
      if (!(base[0] === color[0] && base[1] === color[1] && base[2] === color[2])) continue;
    }
    // fill tiles with 1's if we got a color match
    grid[yy * gw + xx] = 1;
  };

  // trace connected tiles by [x,y]=2
  let queue = [{x: x - bx, y: y - by}];
  while (queue.length > 0) {
    const point = queue.pop();
    const x = point.x;
    const y = point.y;
    const idx = y * gw + x;
    // set this grid tile to 2, if it got traced earlier as a color match
    if (grid[idx] === 1) grid[idx] = 2;
    const nn = (y-1) * gw + x;
    const ee = y * gw + (x+1);
    const ss = (y+1) * gw + x;
    const ww = y * gw + (x-1);
    // abort if we possibly go infinite
    if (
      (y - 1 < -1 || y - 1 > gh) ||
      (x + 1 < -1 || x + 1 > gw) ||
      (y + 1 < -1 || y + 1 > gh) ||
      (x - 1 < -1 || x - 1 > gw)
    ) return ({ infinite: true, grid: null });
    if (grid[nn] === 1) queue.push({x, y:y-1});
    if (grid[ee] === 1) queue.push({x:x+1, y});
    if (grid[ss] === 1) queue.push({x, y:y+1});
    if (grid[ww] === 1) queue.push({x:x-1, y});
  };

  return ({ infinite: false, grid });

};
