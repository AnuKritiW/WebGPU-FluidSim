import './style.css'
import { initWebGPU } from "./gpu/device";
import { createPipelines } from './gpu/pipeline';
import { render } from './renderer';
import { MouseHandler } from "./input";
import { createMouseBuffer, createVelBuffer, createGridSizeBuffer, createRadBuffer, createStrengthBuffer } from './gpu/buffers';

async function main() {
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  document.body.appendChild(canvas);

  // Initialize WebGPU
  const { device: device, context: context, format: canvasFormat } = await initWebGPU(canvas);

  const mouseBuffer = createMouseBuffer(device);
  new MouseHandler(canvas, device, mouseBuffer);

  // DEBUG
  // readMouseBuffer(device, mouseBuffer);

  // Create render pipeline
  const { renderPipeline, velPipeline } = createPipelines(device, canvasFormat);

  const gridSize = 64;
  const velBuffer      = createVelBuffer(device, gridSize);
  const gridSizeBuffer = createGridSizeBuffer(device);
  const radiusBuffer   = createRadBuffer(device);
  const strengthBuffer = createStrengthBuffer(device);

  // Write Initial Values
  const gridSizeData = new Float32Array([gridSize, gridSize]); // vec2<f32>
  const radiusData   = new Float32Array([10.0, 0.0, 0.0, 0.0]); // f32 aligned
  const strengthData = new Float32Array([1.0, 0.0, 0.0, 0.0]); // f32 aligned

  device.queue.writeBuffer(gridSizeBuffer, 0, gridSizeData);
  device.queue.writeBuffer(radiusBuffer, 0, radiusData);
  device.queue.writeBuffer(strengthBuffer, 0, strengthData);

  // Bind buffers to Compute Pipeline
  const bindGroup = device.createBindGroup({
    layout: velPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: velBuffer } },
      { binding: 1, resource: { buffer: mouseBuffer } },
      { binding: 2, resource: { buffer: gridSizeBuffer } },
      { binding: 3, resource: { buffer: radiusBuffer } },
      { binding: 4, resource: { buffer: strengthBuffer } }
    ]
  });

  function runComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(velPipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(gridSize / 8, gridSize / 8);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  function renderLoop() {
    runComputePass();
    // create render pass to draw the quad
    render(device, context, renderPipeline);
    requestAnimationFrame(renderLoop);
  }

  renderLoop();
}

// DEBUG
// async function readMouseBuffer(device: GPUDevice, mouseBuffer: GPUBuffer) {
//   const readBuffer = device.createBuffer({
//     size: mouseBuffer.size,
//     usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
//   });

//   async function update() {
//     const commandEncoder = device.createCommandEncoder();
//     commandEncoder.copyBufferToBuffer(mouseBuffer, 0, readBuffer, 0, mouseBuffer.size);
//     device.queue.submit([commandEncoder.finish()]);

//     await readBuffer.mapAsync(GPUMapMode.READ);
//     const arrayBuffer = readBuffer.getMappedRange();
//     const data = new Float32Array(arrayBuffer);
//     console.log("GPU Buffer Data (Mouse Pos & Vel):", data);
//     readBuffer.unmap();

//     requestAnimationFrame(update); // Continuously read buffer every frame
//   }

//   update();
// }

// Call WebGPU initialization
main();
