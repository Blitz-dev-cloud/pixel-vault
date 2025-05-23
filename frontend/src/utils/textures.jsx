// utils/textures.js
import * as THREE from "three";

export function createWallTexture(color1, color2) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color1;
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = color2;
  for (let i = 0; i < 512; i += 64) {
    for (let j = 0; j < 512; j += 64) {
      if ((i + j) % 128 === 0) ctx.fillRect(i, j, 32, 32);
    }
  }
  const imageData = ctx.getImageData(0, 0, 512, 512);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 20;
    data[i] += noise;
    data[i + 1] += noise;
    data[i + 2] += noise;
  }
  ctx.putImageData(imageData, 0, 0);
  return new THREE.CanvasTexture(canvas);
}

// Similarly, export createFloorTexture, createWoodTexture, createArtTexture, createLabelTexture as in your code.
