import {
  TILE_SIZE,
  MAGIC_SCALE,
  GRID_LINE_WIDTH
} from "../cfg";

import {
  createCanvasBuffer,
  applyImageSmoothing
} from "../utils";

/**
 * @return {CanvasRenderingContext2D}
 */
export function createGridBuffer() {
  const cw = this.cw;
  const ch = this.ch;
  const buffer = createCanvasBuffer(cw, ch);
  if (this.cache.grid !== null) {
    this.cache.grid = null;
    this.destroyTexture(this.cache.gridTexture);
  }
  this.cache.grid = buffer;
  this.cache.gridTexture = this.bufferTexture("grid", buffer.canvas, true);
  this.redrawGridBuffer();
  return (buffer);
};

export function redrawGridBuffer() {
  const buffer = this.cache.grid;
  const texture = this.cache.gridTexture;
  const cr = this.cr;
  const size = (TILE_SIZE * cr) | 0;
  const cx = this.cx;
  const cy = this.cy;
  const cw = this.cw;
  const ch = this.ch;
  buffer.clearRect(0, 0, cw, ch);
  buffer.lineWidth = GRID_LINE_WIDTH;
  buffer.strokeStyle = "rgba(51,51,51,0.5)";
  buffer.beginPath();
  for (let xx = (cx % size) | 0; xx < cw; xx += size) {
    buffer.moveTo(xx, 0);
    buffer.lineTo(xx, ch);
  };
  for (let yy = (cy % size) | 0; yy < ch; yy += size) {
    buffer.moveTo(0, yy);
    buffer.lineTo(cw, yy);
  };
  buffer.stroke();
  buffer.stroke();
  buffer.closePath();
  this.updateTexture(texture, buffer.canvas);
  this.last.cx = this.cx;
  this.last.cy = this.cy;
};

/**
 * @return {WebGLTexture}
 */
export function createBackgroundBuffer() {
  if (this.cache.bg instanceof WebGLTexture) {
    this.destroyTexture(this.cache.bg);
  }
  const size = TILE_SIZE;
  const cw = this.cw;
  const ch = this.ch;
  const canvas = document.createElement("canvas");
  const buffer = canvas.getContext("2d");
  canvas.width = cw;
  canvas.height = ch;
  // dark rectangles
  buffer.fillStyle = "#1f1f1f";
  buffer.fillRect(0, 0, cw, ch);
  // bright rectangles
  buffer.fillStyle = "#212121";
  for (let yy = 0; yy < ch; yy += size*2) {
    for (let xx = 0; xx < cw; xx += size*2) {
      // applied 2 times to increase saturation
      buffer.fillRect(xx, yy, size, size);
      buffer.fillRect(xx, yy, size, size);
    };
  };
  for (let yy = size; yy < ch; yy += size*2) {
    for (let xx = size; xx < cw; xx += size*2) {
      buffer.fillRect(xx, yy, size, size);
    };
  };
  const texture = this.bufferTexture("background", canvas, false);
  return (texture);
};

/**
 * @return {CanvasRenderingContext2D}
 */
export function createForegroundBuffer() {
  const cw = this.cw;
  const ch = this.ch;
  const buffer = createCanvasBuffer(cw, ch);
  applyImageSmoothing(buffer, true);
  if (this.cache.fg !== null) {
    this.cache.fg = null;
    this.destroyTexture(this.cache.fgTexture);
  }
  this.cache.fg = buffer;
  this.cache.fgTexture = this.bufferTexture("foreground", buffer.canvas, true);
  return (buffer);
};

export function createMainBuffer() {
  const ww = this.bounds.w;
  const hh = this.bounds.h;
  const buffer = createCanvasBuffer(ww || 1, hh || 1);
  if (this.cache.main !== null) {
    this.cache.main = null;
    this.destroyTexture(this.cache.mainTexture);
  }
  this.cache.main = buffer;
  this.cache.mainTexture = this.bufferTexture("main", buffer.canvas, false);
  this.updateMainBuffer();
  return (buffer);
};

export function updateMainBuffer() {
  const layers = this.layers;
  const sindex = this.sindex;
  const buffer = this.cache.main;
  for (let ii = 0; ii < layers.length; ++ii) {
    const layer = layers[ii];
    const lx = layer.x;
    const ly = layer.y;
    const batches = layer.batches;
    for (let jj = 0; jj < batches.length; ++jj) {
      const batch = batches[jj];
      const x = batch.bounds.x;
      const y = batch.bounds.y;
      const w = batch.bounds.w;
      const h = batch.bounds.h;
      if (sindex - jj < 0) continue;
      buffer.drawImage(
        batch.buffer.canvas,
        lx + (x - this.bounds.x), ly + (y - this.bounds.y)
      );
    };
  };
  this.updateTexture(this.cache.mainTexture, buffer.canvas);
};
