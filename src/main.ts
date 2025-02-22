import './style.css'
import { initWebGPU } from "./gpu/device";
import { createRenderPipeline } from './gpu/pipeline';
import { render } from './renderer';

async function main() {
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  document.body.appendChild(canvas);

  // Initialize WebGPU
  const { device: device, context: context, format: canvasFormat } = await initWebGPU(canvas);

  // Create render pipeline
  const pipeline = createRenderPipeline(device, canvasFormat);

  // create render pass to draw the quad
  render(device, context, pipeline);
}

// Call WebGPU initialization
main();
