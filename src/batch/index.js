import { MAX_SAFE_INTEGER } from "../cfg";

import {
  uid,
  colorToRgbaString,
  createCanvasBuffer
} from "../utils";

import extend from "../extend";

import Boundings from "../bounds/index";

import * as _raw from "./raw";
import * as _erase from "./erase";
import * as _resize from "./resize";
import * as _boundings from "./boundings";

/**
 * @class Batch
 */
class Batch {
  /**
   * @param {Poxi} instance
   * @constructor
   */
  constructor(instance) {
    this.id = uid();
    this.instance = instance;
    // buffer related
    this.data = null;
    this.buffer = null;
    this.erased = [];
    this.isBuffered = false;
    // relative boundings
    this.bounds = new Boundings();
    // background related
    this.color = null;
    this.isBackground = false;
    // batch got resized or not
    this.isResized = false;
    // we use this batch for erasing
    this.isEraser = false;
    // if we only have raw data
    this.isRawBuffer = false;
    // if set true, then our batch gets possibly resized
    // many times and we don't know it's size until we
    // can turn it into a static rawbuffer
    this.isDynamic = false;
  }
};

Batch.prototype.kill = function() {
  const id = this.id;
  const instance = this.instance;
  const layers = instance.layers;
  for (let ii = 0; ii < layers.length; ++ii) {
    const batches = layers[ii].batches;
    for (let jj = 0; jj < batches.length; ++jj) {
      const batch = batches[jj];
      if (batch.id === id) {
        batch.bounds = null;
        batch.erased = null;
        batch.instance.destroyTexture(batch.texture);
        batches.splice(jj, 1);
        layers[ii].updateBoundings();
        break;
      }
    };
  };
};

/**
 * Get color from buffered batch
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
Batch.prototype.getColorAt = function(x, y) {
  // nothing buffered
  if (this.isEmpty()) return (null);
  // use image data for raw buffers
  // return background color if batch is a filled background
  if (this.isBackground) return (this.color);
  return (this.getRawColorAt(x, y));
};

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color 
 */
Batch.prototype.drawTileAt = function(x, y, color) {
  const bounds = this.bounds;
  const instance = this.instance;
  this.prepareBuffer(x, y);
  this.resizeByOffset(x, y);
  this.buffer.fillStyle = colorToRgbaString(color);
  this.buffer.fillRect(
    x - bounds.x, y - bounds.y,
    1, 1
  );
  this.refreshBuffer();
};

/**
 * @param {Number} x
 * @param {Number} y
 */
Batch.prototype.prepareBuffer = function(x, y) {
  // we don't have a buffer to store data at yet
  if (this.buffer === null) {
    const bounds = this.bounds;
    bounds.x = x;
    bounds.y = y;
    bounds.w = 1;
    bounds.h = 1;
    this.buffer = createCanvasBuffer(1, 1);
    this.texture = this.instance.bufferTexture(this.id, this.buffer.canvas, false);
    this.isResized = true;
  }
};

Batch.prototype.refreshBuffer = function() {
  const bounds = this.bounds;
  const instance = this.instance;
  this.data = this.buffer.getImageData(0, 0, bounds.w, bounds.h).data;
  if (this.isResized) {
    instance.destroyTexture(this.texture);
    this.texture = instance.bufferTexture(this.id, this.buffer.canvas, false);
  } else {
    instance.updateTexture(this.texture, this.buffer.canvas);
  }
  this.isResized = false;
};

/**
 * @return {Boolean}
 */
Batch.prototype.isEmpty = function() {
  if (this.isEraser) return (this.erased.length <= 0);
  const data = this.data;
  const bw = this.bounds.w;
  let count = 0;
  for (let ii = 0; ii < data.length; ii += 4) {
    const idx = ii / 4;
    const xx = idx % bw;
    const yy = (idx / bw) | 0;
    const px = (yy * bw + xx) * 4;
    const r = data[px + 0];
    const g = data[px + 1];
    const b = data[px + 2];
    const a = data[px + 3];
    // ignore empty tiles
    if ((r + g + b <= 0) || a <= 0) continue;
    count++;
  };
  return (count <= 0);
};

extend(Batch, _raw);
extend(Batch, _erase);
extend(Batch, _resize);
extend(Batch, _boundings);

export default Batch;
