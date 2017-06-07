<div align="center">
  <h3>
    Poxi is a modern, flat pixel art editor for the browser with focus on elegance, simplicity and productivity.
  </h3>
</div>

<div align="center">
  <a href="http://maierfelix.github.io/poxi/">Demo</a>
  <br/><br/>
  <a href="https://github.com/maierfelix/poxi/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/BSD2-License-blue.svg?style=flat-square" alt="BSD-2" />
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Renderer-WebGL-red.svg?style=flat-square" alt="No dependencies" />
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Dependencies-None-green.svg?style=flat-square" alt="No dependencies" />
  </a>
  <a href="https://nodejs.org/api/documentation.html#documentation_stability_index">
    <img src="https://img.shields.io/badge/Stability-experimental-orange.svg?style=flat-square" alt="Stability" />
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/🦄-Compatible-ff69b4.svg?style=flat-square" alt="Woot Woot!" />
  </a>
</div>

### Engine features
 - Smart batching
 - WebGL-based renderer
 - Low-level matrices
 - Undo/Redo for all operations
 - Infinite grid
 - Copy by reference
 
I've created this pixel editor because of the lack of smooth pixel editors inside the browser. All current implementations lack of speed and just feel clunky and slow. I've created a whole low-level pixel matrix framework from scratch for this, offering incredible speed, a undo/redo state machine and various basic transformation methods. This allows you to work on images even larger than 8000px á 8000px with very low memory consummation.

### Coming soon
 - Animations
 - Selections
 - Faster bucket filling

### Contributing

Code related pull requests are very welcome, but please make sure they match the existing code style.

### License
[BSD-2](https://github.com/maierfelix/poxi/blob/master/LICENSE)
