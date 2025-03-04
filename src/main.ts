import './style.css'
import { initWebGPU } from "./gpu/device";
import { createPipelines } from './gpu/pipeline';
import { MouseHandler } from "./input";
import { createBuffers } from './gpu/buffers';
import { createBindGroups } from './gpu/bindGroups';
import { startSimulation } from './simulation';

async function main() {
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  document.body.appendChild(canvas);

  // Initialize WebGPU
  const { device: device, context: context, format: canvasFormat } = await initWebGPU(canvas);

  const gridSize = 512;
  const buffers = createBuffers(device, gridSize, canvas);
  const pipelines = createPipelines(device, canvasFormat);
  const bindGroups = createBindGroups(device, pipelines, buffers);

  // const mouseBuffer = createMouseBuffer(device);
  const mouseHandler = new MouseHandler(canvas, device, buffers.mouseBuf);

  startSimulation({
    device,
    context,
    buffers,
    bindGroups,
    pipelines,
    mouseHandler,
    gridSize
  });
}

// Call WebGPU initialization
main();
