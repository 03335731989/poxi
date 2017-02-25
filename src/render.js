import {
  TILE_SIZE,
  MIN_SCALE,
  MAX_SCALE,
  HIDE_GRID,
  GRID_LINE_WIDTH
} from "./cfg";

import {
  createCanvasBuffer,
  applyImageSmoothing
} from "./utils";

/**
 * @param {Number} width
 * @param {Number} height
 */
export function resize(width, height) {
  if (width >= 0) this.width = width;
  if (height >= 0) this.height = height;
  this.view.width = width;
  this.view.height = height;
  applyImageSmoothing(this.ctx, false);
  this.camera.resize(width, height);
  // re-generate our bg
  this.generateBackground();
  this.clear();
  this.render();
};

export function clear() {
  this.ctx.clearRect(0, 0, this.width, this.height);
};

export function render() {
  this.renderBackground();
  this.renderBatches();
  if (this.camera.s > (MIN_SCALE + HIDE_GRID)) {
    this.renderGrid();
  }
  this.renderStats();
};

export function renderBackground() {
  let width = this.camera.width
  let height = this.camera.height;
  this.ctx.drawImage(
    this.bg,
    0, 0,
    width, height,
    0, 0,
    width, height
  );
};

export function renderGrid() {
  let ctx = this.ctx;
  let size = (TILE_SIZE*this.camera.s)|0;
  let cx = this.camera.x;
  let cy = this.camera.y;
  let cw = this.camera.width;
  let ch = this.camera.height;
  ctx.lineWidth = GRID_LINE_WIDTH;
  ctx.strokeStyle = "rgba(51,51,51,0.75)";
  ctx.beginPath();
  for (let xx = (cx%size)|0; xx < cw; xx += size) {
    ctx.moveTo(xx, 0);
    ctx.lineTo(xx, ch);
  };
  for (let yy = (cy%size)|0; yy < ch; yy += size) {
    ctx.moveTo(0, yy);
    ctx.lineTo(cw, yy);
  };
  ctx.stroke();
  ctx.closePath();
};

export function renderBatches() {
  let sIndex = this.editor.sindex;
  let batches = this.editor.stack;
  for (let ii = 0; ii < batches.length; ++ii) {
    let batch = batches[ii].batch;
    // batch index is higher than stack index, so ignore this batch
    if (sIndex - ii < 0) continue;
    // draw batched buffer (faster, drawImage)
    if (batch.isBuffered) this.drawBatchedBuffer(batch);
    // draw batched tiles (slower, fillRect)
    else this.drawBatchedTiles(batch);
  };
  // draw currently drawn tiles
  if (this.editor.modes.draw) {
    let length = this.editor.batches.length;
    if (length > 0) this.drawBatchedTiles(this.editor.batches[length - 1]);
  }
  this.drawHoveredTile();
};

/**
 * @param {Batch} batch
 */
export function drawBatchedTiles(batch) {
  let cx = this.camera.x;
  let cy = this.camera.y;
  let scale = this.camera.s;
  let ww = (TILE_SIZE * scale) | 0;
  let hh = (TILE_SIZE * scale) | 0;
  let ctx = this.ctx;
  let tiles = batch.tiles;
  for (let jj = 0; jj < tiles.length; ++jj) {
    let tile = tiles[jj];
    if (!this.editor.isTileInsideView(tile)) continue;
    let x = (cx + ((tile.x * TILE_SIZE) * scale)) | 0;
    let y = (cy + ((tile.y * TILE_SIZE) * scale)) | 0;
    let color = tile.colors[tile.cindex];
    let r = color[0];
    let g = color[1];
    let b = color[2];
    let a = color[3];
    ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
    ctx.fillRect(x, y, ww, hh);
  };
};

/**
 * @param {Batch} batch
 */
export function drawBatchedBuffer(batch) {
  let cx = this.camera.x | 0;
  let cy = this.camera.y | 0;
  let scale = this.camera.s;
  let bx = batch.buffer.x * TILE_SIZE;
  let by = batch.buffer.y * TILE_SIZE;
  let x = (cx + (bx * scale)) | 0;
  let y = (cy + (by * scale)) | 0;
  let width = (batch.buffer.width * TILE_SIZE) | 0;
  let height = (batch.buffer.height * TILE_SIZE) | 0;
  this.ctx.drawImage(
    batch.buffer.view,
    0, 0,
    width, height,
    x, y,
    (width * TILE_SIZE * scale) | 0, (height * TILE_SIZE * scale) | 0
  );
};

export function drawHoveredTile() {
  let ctx = this.ctx;
  let cx = this.camera.x;
  let cy = this.camera.y;
  let scale = this.camera.s;
  let ww = (TILE_SIZE * scale) | 0;
  let hh = (TILE_SIZE * scale) | 0;
  // apply empty tile hover color
  let mx = this.editor.mx;
  let my = this.editor.my;
  let relative = this.editor.getRelativeOffset(mx, my);
  let rx = relative.x * TILE_SIZE;
  let ry = relative.y * TILE_SIZE;
  let x = ((cx + GRID_LINE_WIDTH/2) + (rx * scale)) | 0;
  let y = ((cy + GRID_LINE_WIDTH/2) + (ry * scale)) | 0;
  ctx.fillStyle = `rgba(255, 255, 255, 0.2)`;
  ctx.fillRect(x, y, ww, hh);
};

export function renderStats() {
  this.ctx.fillStyle = "#ffffff";
  // render mouse hovered color
  let mx = this.editor.mx;
  let my = this.editor.my;
  let relative = this.editor.getRelativeOffset(mx, my);
  let rx = relative.x;
  let ry = relative.y;
  let tile = this.editor.getTileAt(rx, ry);
  this.ctx.fillText(`x:${rx}, y:${ry}`, 16, 32);
  if (tile !== null) {
    let color = tile.colors[tile.cindex];
    let r = color[0];
    let g = color[1];
    let b = color[2];
    let a = color[3];
    this.ctx.fillText(`${r},${g},${b},${a}`, 16, 48);
  }
  this.renderFPS();
};

export function renderFPS() {
  let now = Date.now();
  let delta = now - this.last;
  this.last = now;
  this.ctx.fillText((1e3 / delta) | 0, 16, 16);
};

/**
 * Background grid as transparency placeholder
 */
export function generateBackground() {

  let size = 8;

  let cw = this.width;
  let ch = this.height;

  let buffer = createCanvasBuffer(cw, ch);

  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");

  canvas.width = cw;
  canvas.height = ch;

  this.bg = canvas;

  // dark rectangles
  ctx.fillStyle = "#1f1f1f";
  ctx.fillRect(0, 0, cw, ch);

  // bright rectangles
  ctx.fillStyle = "#212121";
  for (let yy = 0; yy < ch; yy += size*2) {
    for (let xx = 0; xx < cw; xx += size*2) {
      ctx.fillRect(xx, yy, size, size);
      ctx.fillRect(xx, yy, size, size);
    };
  };
  for (let yy = size; yy < ch; yy += size*2) {
    for (let xx = size; xx < cw; xx += size*2) {
      ctx.fillRect(xx, yy, size, size);
    };
  };

};