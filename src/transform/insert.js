import { SETTINGS } from "../cfg";
import { alignToGrid } from "../math";
import { getRainbowColor } from "../color";

import CommandKind from "../stack/kind";

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x
 * @param {Number} y
 */
export function insertImage(ctx, x, y) {
  const layer = this.getCurrentLayer();
  const batch = this.createDynamicBatch();
  batch.drawImage(ctx, x, y);
  layer.addBatch(batch);
  this.enqueue(CommandKind.DRAW_IMAGE, batch);
};

/**
 * @param {Number} x0
 * @param {Number} y0
 * @param {Number} x1
 * @param {Number} y1
 */
export function insertLine(x0, y0, x1, y1) {

  const base = 8 * this.cr;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = (x0 < x1) ? 1 : -1;
  const sy = (y0 < y1) ? 1 : -1;
  let err = (dx - dy);

  const last = this.last;
  const batch = this.getCurrentDrawingBatch();
  while (true) {
    const relative = this.getRelativeTileOffset(x0, y0);
    // TODO: limit repeation rate on brush size
    if (this.states.drawing) {
      batch.drawTile(relative.x, relative.y, SETTINGS.PENCIL_SIZE, SETTINGS.PENCIL_SIZE, this.fillStyle);
    }
    else if (this.states.erasing) {
      batch.clearAt(relative.x, relative.y, SETTINGS.ERASER_SIZE);
    }
    else if (this.states.lighting) {
      batch.applyColorLightness(relative.x, relative.y, SETTINGS.LIGHTING_MODE);
    }
    else if (this.states.stroke) {
      batch.drawTile(x0, y0, SETTINGS.PENCIL_SIZE, SETTINGS.PENCIL_SIZE, this.fillStyle);
    }
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  };
};

/**
 * Inserts stroked arc at given position
 * @param {Batch} batch
 * @param {Number} x
 * @param {Number} y
 * @param {Number} radius
 * @param {Array} color
 */
export function strokeArc(batch, x, y, radius, color) {
  radius = (radius || 1.0) | 0;
  if (!color) color = [255, 255, 255, 1];
  this.insertArc(batch, x, y, radius, color);
};

/**
 * Inserts filled arc at given position
 * @param {Batch} batch
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} radius
 * @param {Array} color
 */
export function insertArc(batch, x1, y1, radius, color) {
  let x2 = radius;
  let y2 = 0;
  let err = 1 - x2;
  const w = SETTINGS.PENCIL_SIZE;
  const h = SETTINGS.PENCIL_SIZE;
  for (; x2 >= y2;) {
    batch.drawTile(x2 + x1, y2 + y1, w, h, color);
    batch.drawTile(y2 + x1, x2 + y1, w, h, color);
    batch.drawTile(-x2 + x1, y2 + y1, w, h, color);
    batch.drawTile(-y2 + x1, x2 + y1, w, h, color);
    batch.drawTile(-x2 + x1, -y2 + y1, w, h, color);
    batch.drawTile(-y2 + x1, -x2 + y1, w, h, color);
    batch.drawTile(x2 + x1, -y2 + y1, w, h, color);
    batch.drawTile(y2 + x1, -x2 + y1, w, h, color);
    y2++;
    if (err <= 0) {
      err += 2 * y2 + 1;
    }
    if (err > 0) {
      x2--;
      err += 2 * (y2 - x2) + 1;
    }
  };
};

/**
 * Inserts filled rectangle at given position
 * @param {Batch} batch
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 * @param {Array} color
 */
export function fillRect(batch, x, y, width, height, color) {
  if (!color) color = [255, 255, 255, 1];
  this.insertRectangleAt(
    batch,
    x | 0, y | 0,
    width | 0, height | 0,
    color, true
  );
};

/**
 * Inserts stroked rectangle at given position
 * @param {Batch} batch
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 * @param {Array} color
 */
export function strokeRect(batch, x, y, width, height, color) {
  if (!color) color = [255, 255, 255, 1];
  this.insertRectangleAt(
    batch,
    x | 0, y | 0,
    width | 0, height | 0,
    color, false
  );
};

/**
 * Inserts rectangle at given position
 * @param {Batch} batch
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} x2
 * @param {Number} y2
 * @param {Array} color
 * @param {Boolean} filled
 */
export function insertRectangleAt(batch, x1, y1, x2, y2, color, filled) {
  const width = Math.abs(x2);
  const height = Math.abs(y2);
  const dx = (x2 < 0 ? -1 : 1);
  const dy = (y2 < 0 ? -1 : 1);
  const w = SETTINGS.PENCIL_SIZE;
  const h = SETTINGS.PENCIL_SIZE;
  for (let ii = 0; ii < width * height; ++ii) {
    const xx = (ii % width);
    const yy = (ii / width) | 0;
    // ignore inner tiles if rectangle not filled
    if (!filled) {
      if (!(
        (xx === 0 || xx >= width-1) ||
        (yy === 0 || yy >= height-1))
      ) continue;
    }
    batch.drawTile(x1 + xx * dx, y1 + yy * dy, w, h, color);
  }
};
