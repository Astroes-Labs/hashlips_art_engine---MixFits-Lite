const { createCanvas, loadImage } = require("canvas");

class CanvasRenderer {
  constructor(config) {
    this.config = config;

    this.canvas = createCanvas(
      config.render.width,
      config.render.height
    );

    this.ctx = this.canvas.getContext("2d");
  }

  clear() {
    this.ctx.clearRect(
      0,
      0,
      this.config.render.width,
      this.config.render.height
    );
  }

 async render(traits) {
  this.clear();

  for (const [layerName, traitName] of Object.entries(traits)) {

    console.log("PROCESSING LAYER", layerName);
    console.log("PROCESSING TRAIT", traitName);

    if (!traitName) continue;

    const imagePath = `${process.cwd()}/layers/${layerName}/${traitName}.png`;

    console.log("IMAGE PATH", imagePath);

    const img = await loadImage(imagePath);

    this.ctx.drawImage(
      img,
      0,
      0,
      this.config.render.width,
      this.config.render.height
    );
  }

  return this.canvas;
}
}

module.exports = CanvasRenderer;