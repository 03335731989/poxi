import { MODES } from "../cfg";
import { additiveAlphaColorBlending } from "../color";

import CommandKind from "./kind";

/**
 * Manually refresh the stack,
 * clear future operations etc.
 */
export function refreshStack() {
  if (this.sindex < this.stack.length - 1) {
    this.dequeue(this.sindex, this.stack.length - 1);
  } else {
    this.stack.splice(this.sindex + 1, this.stack.length);
  }
  //this.updateGlobalBoundings();
};

/**
 * Returns the latest stack operation
 * @return {Object}
 */
export function currentStackOperation() {
  return (this.stack[this.sindex]);
};

/**
 * @param {Command} cmd
 * @param {Boolean} state
 */
export function fire(cmd, state) {
  const kind = this.getCommandKind(cmd);
  switch (kind) {
    case CommandKind.LAYER_OPERATION:
      this.fireLayerOperation(cmd, state);
    break;
    case CommandKind.BATCH_OPERATION:
      this.fireBatchOperation(cmd, state);
    break;
  };
};

/**
 * @param {Command} cmd
 * @param {Boolean} state
 */
export function fireLayerOperation(cmd, state) {
  const kind = cmd.kind;
  const batch = cmd.batch;
  const layer = batch.layer;
  const main = layer.batch;
  switch (kind) {
    // TODO: buggy, not working
    case CommandKind.LAYER_CLONE:
    case CommandKind.LAYER_CLONE_REF:
      if (state) {
        this.layers.splice(batch.index, 0, layer);
        layer.addUiReference();
        this.setActiveLayer(layer);
      } else {
        layer.removeUiReference();
        this.layers.splice(batch.index, 1);
        const index = batch.index < 0 ? 0 : batch.index;
        this.setActiveLayer(this.getLayerByIndex(index));
      }
      main.refreshTexture(true);
    break;
    case CommandKind.LAYER_ADD:
      if (state) {
        this.layers.splice(batch.index, 0, layer);
        layer.addUiReference();
        this.setActiveLayer(layer);
      } else {
        layer.removeUiReference();
        this.layers.splice(batch.index, 1);
        const index = batch.index < 0 ? 0 : batch.index;
        this.setActiveLayer(this.getLayerByIndex(index));
      }
    break;
    case CommandKind.LAYER_REMOVE:
      if (!state) {
        this.layers.splice(batch.index, 0, layer);
        layer.addUiReference();
        this.setActiveLayer(layer);
      } else {
        layer.removeUiReference();
        this.layers.splice(batch.index, 1);
        let index = batch.index < 0 ? 0 : batch.index;
        index = index === this.layers.length ? index - 1 : index;
        this.setActiveLayer(this.getLayerByIndex(index));
      }
    break;
    case CommandKind.LAYER_RENAME:
      layer.name = batch[state ? "name": "oname"];
    break;
    case CommandKind.LAYER_LOCK:
      layer.locked = !layer.locked;
    break;
    case CommandKind.LAYER_VISIBILITY:
      layer.visible = !layer.visible;
    break;
    case CommandKind.LAYER_ORDER:
      if (state) {
        const tmp = this.layers[batch.oindex];
        this.layers[batch.oindex] = this.layers[batch.index];
        this.layers[batch.index] = tmp;
        tmp.removeUiReference(); tmp.addUiReference();
        this.setActiveLayer(tmp);
      } else {
        const tmp = this.layers[batch.index];
        this.layers[batch.index] = this.layers[batch.oindex];
        this.layers[batch.oindex] = tmp;
        tmp.removeUiReference(); tmp.addUiReference();
        this.setActiveLayer(tmp);
      }
    break;
    case CommandKind.LAYER_MOVE:
      layer.updateBoundings();
      const dir = state ? 1 : -1;
      layer.x += (batch.position.x * dir);
      layer.y += (batch.position.y * dir);
    break;
    case CommandKind.LAYER_FLIP_VERTICAL:
    break;
    case CommandKind.LAYER_FLIP_HORIZONTAL:
    break;
    case CommandKind.LAYER_MERGE:
      batch.merge.mergeWithLayer(layer, state);
    break;
  };
};

/**
 * @param {Command} cmd
 * @param {Boolean} state
 */
export function fireBatchOperation(cmd, state) {
  const batch = cmd.batch;
  const layer = batch.layer;
  const main = layer.batch;
  const kind = cmd.kind;
  layer.updateBoundings();
  main.injectMatrix(batch, state);
  main.refreshTexture(true);
};

/**
 * @param {Command} cmd
 * @return {Number}
 */
export function getCommandKind(cmd) {
  const kind = cmd.kind;
  switch (kind) {
    case CommandKind.LAYER_LOCK:
    case CommandKind.LAYER_MOVE:
    case CommandKind.LAYER_ORDER:
    case CommandKind.LAYER_RENAME:
    case CommandKind.LAYER_ROTATE:
    case CommandKind.LAYER_VISIBILITY:
    case CommandKind.LAYER_ADD:
    case CommandKind.LAYER_REMOVE:
    case CommandKind.LAYER_CLONE:
    case CommandKind.LAYER_MERGE:
    case CommandKind.LAYER_FLIP_VERTICAL:
    case CommandKind.LAYER_FLIP_HORIZONTAL:
      return (CommandKind.LAYER_OPERATION);
    break;
    case CommandKind.DRAW:
    case CommandKind.ERASE:
    case CommandKind.FILL:
    case CommandKind.BACKGROUND:
    case CommandKind.PASTE:
    case CommandKind.CUT:
    case CommandKind.INSERT_IMAGE:
    case CommandKind.STROKE:
    case CommandKind.RECT_FILL:
    case CommandKind.RECT_STROKE:
    case CommandKind.ARC_FILL:
    case CommandKind.ARC_STROKE:
    case CommandKind.FLOOD_FILL:
    case CommandKind.LIGHTING:
      return (CommandKind.BATCH_OPERATION);
    break;
  };
  return (CommandKind.UNKNOWN);
};
