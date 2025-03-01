import './style.css'
import { initWebGPU } from "./gpu/device";
import { createPipelines } from './gpu/pipeline';
import { render } from './renderer';
import { MouseHandler } from "./input";
import { createMouseBuffer, createVelBuffer, createGridSizeBuffer, createRadBuffer, createStrengthBuffer, createDyeFieldBuffer,
         createDyeFieldOutBuffer, createDeltaTimeBuffer, createDecayBuffer, createInjectionAmtBuffer} from './gpu/buffers';

// TODO: cleanup!! abstract out stuff
async function main() {
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  document.body.appendChild(canvas);

  // Initialize WebGPU
  const { device: device, context: context, format: canvasFormat } = await initWebGPU(canvas);

  const mouseBuffer = createMouseBuffer(device);
  const mouseHandler = new MouseHandler(canvas, device, mouseBuffer);

  const gridSize = 64;

  // ping-pong update
  // one buffer holds the current state (input) and the other buffer holds current computation (output)
  // after running the compute pass, swap the output back to become the new input for the next frame
  // This prevents data from being overwritten during processing --> new sim starts with the latest state
  // This ultimately should enable continuous evolution of dye overtime
  function updateDyeField(
    device: GPUDevice,
    dyeFieldBuffer: GPUBuffer,
    dyeFieldOutBuffer: GPUBuffer
  ) {
    const commandEncoder = device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(
      dyeFieldOutBuffer,
      0,
      dyeFieldBuffer,
      0,
      dyeFieldBuffer.size
    );
    device.queue.submit([commandEncoder.finish()]);
  }

  // DEBUG
  // readMouseBuffer(device, mouseBuffer);

  // Create render pipeline
  const { renderPipeline, velPipeline, advectionPipeline, decayPipeline, injectionPipeline } = createPipelines(device, canvasFormat);

  const velBuffer      = createVelBuffer(device, gridSize);
  const gridSizeBuffer = createGridSizeBuffer(device);
  const radiusBuffer   = createRadBuffer(device);
  const strengthBuffer = createStrengthBuffer(device);

  // Write Initial Values
  const gridSizeData = new Float32Array([gridSize, gridSize]); // vec2<f32>
  // TODO: adjust these parameters to see velocity injection more/less easily
  const radiusData   = new Float32Array([5.0, 0.0, 0.0, 0.0]); // f32 aligned
  const strengthData = new Float32Array([100.0, 0.0, 0.0, 0.0]); // f32 aligned

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

  const dyeFieldBuffer = createDyeFieldBuffer(device, gridSize);
  const dyeFieldOutBuffer = createDyeFieldOutBuffer(device, gridSize);
  const deltaTimeBuffer = createDeltaTimeBuffer(device);

  const advectionBindGroup = device.createBindGroup({
    layout: advectionPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: velBuffer } },
      { binding: 1, resource: { buffer: dyeFieldBuffer } },
      { binding: 2, resource: { buffer: dyeFieldOutBuffer } },
      { binding: 3, resource: { buffer: gridSizeBuffer } },
      { binding: 4, resource: { buffer: deltaTimeBuffer } }
    ]
  });

  function runAdvectionComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(advectionPipeline);
    passEncoder.setBindGroup(0, advectionBindGroup);
    passEncoder.dispatchWorkgroups(gridSize / 8, gridSize / 8);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  };

  const injectionAmtBuffer = createInjectionAmtBuffer(device);

  const injectionAmtData = new Float32Array([0.2, 0.0, 0.0 , 0.0]);
  device.queue.writeBuffer(injectionAmtBuffer, 0, injectionAmtData);

  const injectionBindGroup = device.createBindGroup({
    layout: injectionPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: dyeFieldBuffer } },
      { binding: 1, resource: { buffer: mouseBuffer } },
      { binding: 2, resource: { buffer: injectionAmtBuffer } },
      { binding: 3, resource: { buffer: gridSizeBuffer } }
    ]
  });

  function runInjectionComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(injectionPipeline);
    passEncoder.setBindGroup(0, injectionBindGroup);
    passEncoder.dispatchWorkgroups(gridSize / 8, gridSize / 8);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  };

  const decayBuffer = createDecayBuffer(device);
  const decayData = new Float32Array([0.99, 0.0, 0.0, 0.0]); // f32 aligned
  device.queue.writeBuffer(decayBuffer, 0, decayData);

  const decayBindGroup = device.createBindGroup({
    layout: decayPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: gridSizeBuffer } },
      { binding: 1, resource: { buffer: dyeFieldBuffer } },
      { binding: 2, resource: { buffer: decayBuffer } }
    ]
  });

  function runDecayComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(decayPipeline);
    passEncoder.setBindGroup(0, decayBindGroup);
    passEncoder.dispatchWorkgroups(gridSize / 8, gridSize / 8);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  };

  const canvasSizeBuffer = device.createBuffer({
    size: 2 * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  const canvasSizeData = new Float32Array([canvas.width, canvas.height]);
  device.queue.writeBuffer(canvasSizeBuffer, 0, canvasSizeData);

  const renderBindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: gridSizeBuffer } },
      { binding: 1, resource: { buffer: canvasSizeBuffer } },
      { binding: 2, resource: { buffer: dyeFieldBuffer } }
    ]
  });

  function renderLoop() {

    if (mouseHandler.isMouseDown) {
      runInjectionComputePass();
    }

    runComputePass();
    runAdvectionComputePass();
    updateDyeField(device, dyeFieldBuffer, dyeFieldOutBuffer);
    runDecayComputePass();
    // create render pass to draw the quad
    render(device, context, renderPipeline, renderBindGroup);
    // DEBUG
    // readVelocityBuffer(device, velBuffer);
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

// DEBUG
// async function readVelocityBuffer(device: GPUDevice, velocityBuffer: GPUBuffer) {
//   // Create a readback buffer
//   const readBuffer = device.createBuffer({
//       size: velocityBuffer.size,
//       usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
//   });

//   // Copy GPU buffer to the read buffer
//   const commandEncoder = device.createCommandEncoder();
//   commandEncoder.copyBufferToBuffer(velocityBuffer, 0, readBuffer, 0, velocityBuffer.size);
//   device.queue.submit([commandEncoder.finish()]);

//   // Wait for the GPU to complete execution
//   await readBuffer.mapAsync(GPUMapMode.READ);

//   // Read buffer content
//   const arrayBuffer = readBuffer.getMappedRange();
//   const velocityData = new Float32Array(arrayBuffer);

//   // Compute speed (length of velocity vector for each grid cell)
//   const speeds = [];
//   for (let i = 0; i < velocityData.length; i += 2) {
//       const vx = velocityData[i];   // x-component of velocity
//       const vy = velocityData[i + 1]; // y-component of velocity
//       const speed = Math.sqrt(vx * vx + vy * vy); // Compute magnitude
//       speeds.push(speed);
//   }

//   console.log("Speed values:", speeds);

//   readBuffer.unmap();
// }


// Call WebGPU initialization
main();
