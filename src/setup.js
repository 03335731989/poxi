import { rgbaToHex } from "./color";
import { getWGLContext } from "./utils";

import Batch from "./batch/index";
import Layer from "./layer/index";

export function setup() {
  const view = document.createElement("canvas");
  const width = window.innerWidth;
  const height = window.innerHeight;
  view.width = width;
  view.height = height;
  // sync storage colors with stage colors
  const colors = this.readStorage("favorite_colors");
  if (colors && colors.length > 2) {
    this.favoriteColors = JSON.parse(colors);
    this.updateFastColorPickMenu();
    this.setUiColor(rgbaToHex(this.favoriteColors[0].color));
  } else {
    this.setUiColor(rgbaToHex([255,0,0,1]));
  }
  this.setupRenderer(view);
  this.initListeners();
  this.resize(width, height);
  this.scale(0);
  const draw = () => {
    requestAnimationFrame(() => draw());
    if (this.redraw) {
      this.clear();
      this.render();
    }
  };
  // add some things manually
  (() => {
    this.layers.push(new Layer(this));
    this.layers.push(new Layer(this));
  })();
  requestAnimationFrame(() => draw());
  this.setupUi();
  document.body.appendChild(view);
};
