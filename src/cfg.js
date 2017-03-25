// default view size
export const DEFAULT_WIDTH = 480;
export const DEFAULT_HEIGHT = 320;
// default grid hidden or not
export const DEFAULT_GRID_HIDDEN = false;

export const TILE_SIZE = 8;
export const MIN_SCALE = 1;
export const MAX_SCALE = 32;
export const MAGIC_SCALE = .125;
// trace ghost tiles by alpha=^2
export const UNSET_TILE_COLOR = 2;
export const ERASE_TILE_COLOR = [0, 1, 0, 0.1];
export const BASE_TILE_COLOR = [0, 0, 0, 0];
export const SELECTION_COLOR = [1, 1, 1, 0.1];
export const SELECTION_COLOR_ACTIVE = [1, 1, 1, 0.2];
export const TILE_HOVER_COLOR = [1, 1, 1, 0.2];

// 32-bit ints are allowed at maximum
export const MAX_SAFE_INTEGER = (2 ** 31) - 1;

// alpha byte to rgb-alpha conversion
export const MAGIC_RGB_A_BYTE = 0.00392;

// factor when to hide the grid
export const HIDE_GRID = 0.5;
export const GRID_LINE_WIDTH = 0.25;

// how fast we can scale with our mouse wheel
export const ZOOM_SPEED = 15;

/**
 * If a tile batch exceeds the min size,
 * we buffer it inside a shadow canvas,
 * exceeding limit throws an out of bounds error
 */
export const BATCH_BUFFER_SIZE = {
  MIN_W: 1,
  MIN_H: 1,
  MIN_L: 1
};

// Maximum allowed items inside stack
export const STACK_LIMIT = 128;

// WebGL texture limit
export const WGL_TEXTURE_LIMIT = STACK_LIMIT * 2;

// WebGL supported or not
export const WGL_SUPPORTED = (
  typeof WebGLRenderingContext !== "undefined"
);

// WebAssembly supported or not
export const WASM_SUPPORTED = (
  typeof WebAssembly !== "undefined"
);

// dev mode state
export let MODES = {
  DEV: false
};

// different settings
export let SETTINGS = {
  PENCIL_SIZE: 2,
  ERASER_SIZE: 2
};
