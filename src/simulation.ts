import { render } from './renderer';

export function startSimulation({ device, context, buffers, bindGroups, pipelines, mouseHandler, gridSize }) {
  async function simulationLoop() {
    updateDeltaTime(device, buffers);

    // If the mouse is down, run injection pass.
    if (mouseHandler.isMouseDown) {
      runInjectionComputePass();
    }

    runComputePass();
    runAdvectionComputePass();
    updateDyeField();
    runDecayComputePass();
    resetDivergenceBuffer();
    runDivergenceComputePass()
    for (let i = 0; i < 60; i++) {  // 20 iterations (tune this value)
      runPressureComputePass();  // dispatch pressure.wgsl
    }
    runSubPressureComputePass();  // dispatch subtractPressure.wgsl
    runVelocityAdvectionPass();
    updateVelocityField();
    runVorticityComputePass();
    runAddVorticityComputePass();

    // await readDivergenceBuffer(device, buffers.divBuf);

    render(device, context, pipelines.renderPipeline, getRenderBindGroup());

    requestAnimationFrame(simulationLoop);
  }

  const workgroupSize = 8;
  const dispatchSizeX = Math.ceil(gridSize / workgroupSize);
  const dispatchSizeY = Math.ceil(gridSize / workgroupSize);
  
  // Example: Wrapping the injection pass.
  function runInjectionComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.injectionPipeline);
    // Reuse the mouse buffer for injection pos; injectionAmount is in its own uniform.
    passEncoder.setBindGroup(0, bindGroups.injectionBindGroup);
    passEncoder.dispatchWorkgroups(dispatchSizeX, dispatchSizeY);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }
  
  function runComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.velPipeline);
    passEncoder.setBindGroup(0, bindGroups.velBindGroup);
    passEncoder.dispatchWorkgroups(dispatchSizeX, dispatchSizeY);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  let lastFrameTime = performance.now();

  function updateDeltaTime(device, buffers) {
    const currentTime = performance.now();
    let deltaTime = (currentTime - lastFrameTime) / 1000.0; // Convert ms → seconds
    lastFrameTime = currentTime;

    // console.log("Delta Time:", deltaTime);
    // if(deltaTime < 0.005) {
    //   console.warn("Delta time is very low:", deltaTime);
    // }

    // if (deltaTime > (1.0 / 60.0)) {
    //   deltaTime = (1.0 / 60.0);
    // }

    const deltaTimeData = new Float32Array([deltaTime]);
    device.queue.writeBuffer(buffers.deltaTimeBuf, 0, deltaTimeData);
  }

  
  function runAdvectionComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.advectionPipeline);
    passEncoder.setBindGroup(0, bindGroups.advectionBindGroup);
    passEncoder.dispatchWorkgroups(dispatchSizeX, dispatchSizeY);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }
  
  function runDecayComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.decayPipeline);
    passEncoder.setBindGroup(0, bindGroups.decayBindGroup);
    passEncoder.dispatchWorkgroups(dispatchSizeX, dispatchSizeY);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  function resetDivergenceBuffer() {
    const zeroData = new Float32Array(gridSize * gridSize).fill(0);
    device.queue.writeBuffer(buffers.divBuf, 0, zeroData);
}

  function runDivergenceComputePass() {
    // console.log("🚀 Running Divergence Compute Pass...");
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.divPipeline);
    passEncoder.setBindGroup(0, bindGroups.divBindGroup);
    // console.log(`🔧 Dispatching divergence compute shader with ${dispatchSizeX} x ${dispatchSizeY}`);
    passEncoder.dispatchWorkgroups(dispatchSizeX, dispatchSizeY);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
    // console.log("✅ Divergence Compute Pass Dispatched!");
  }

  function runPressureComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.pressurePipeline);
    passEncoder.setBindGroup(0, bindGroups.pressureBindGroup);
    passEncoder.dispatchWorkgroups(dispatchSizeX, dispatchSizeY);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  function runSubPressureComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.subPressurePipeline);
    passEncoder.setBindGroup(0, bindGroups.subPressureBindGroup);
    passEncoder.dispatchWorkgroups(dispatchSizeX, dispatchSizeY);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  function runVelocityAdvectionPass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.advectVelPipeline);
    passEncoder.setBindGroup(0, bindGroups.advectVelBindGroup);
    passEncoder.dispatchWorkgroups(dispatchSizeX, dispatchSizeY);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  function runVorticityComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.vorticityPipeline);
    passEncoder.setBindGroup(0, bindGroups.vorticityBindGroup);
    passEncoder.dispatchWorkgroups(dispatchSizeX, dispatchSizeY);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  function runAddVorticityComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.addVorticityPipeline);
    passEncoder.setBindGroup(0, bindGroups.addVorticityBindGroup);
    passEncoder.dispatchWorkgroups(dispatchSizeX, dispatchSizeY);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }
  
  // ping-pong update
  // one buffer holds the current state (input) and the other buffer holds current computation (output)
  // after running the compute pass, swap the output back to become the new input for the next frame
  // This prevents data from being overwritten during processing --> new sim starts with the latest state
  // This ultimately should enable continuous evolution of dye overtime
  function updateDyeField() {
    const commandEncoder = device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(
      buffers.dyeFieldOutBuf,
      0,
      buffers.dyeFieldBuf,
      0,
      buffers.dyeFieldBuf.size
    );
    device.queue.submit([commandEncoder.finish()]);
  }

  function updateVelocityField() {
    const commandEncoder = device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(
      buffers.velOutBuf,
      0,
      buffers.velBuf,
      0,
      buffers.velBuf.size
    );
    device.queue.submit([commandEncoder.finish()]);
  }
  
  // Assemble the render bind group based on current state.
  function getRenderBindGroup() {
    return device.createBindGroup({
      layout: pipelines.renderPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: buffers.gridSizeBuf } },
        { binding: 1, resource: { buffer: buffers.canvasSizeBuf } },
        { binding: 2, resource: { buffer: buffers.dyeFieldBuf } }
      ]
    });
  }

  async function readDivergenceBuffer(device, divergenceBuffer) {
    const readBuffer = device.createBuffer({
      size: divergenceBuffer.size,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ, // Readable on CPU
    });

    // Create command encoder
    const commandEncoder = device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(divergenceBuffer, 0, readBuffer, 0, divergenceBuffer.size);
    device.queue.submit([commandEncoder.finish()]);

    // Wait for GPU to complete work
    await readBuffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = readBuffer.getMappedRange();
    const divergenceValues = new Float32Array(arrayBuffer);

    console.log("Divergence Buffer Values:", divergenceValues);
    readBuffer.unmap();
  }
  
  simulationLoop();
}
