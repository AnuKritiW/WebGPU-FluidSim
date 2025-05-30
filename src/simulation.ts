import { render } from './renderer';
import { MouseHandler } from './input';

interface PipelineMap {
  renderPipeline: GPURenderPipeline,
  injectDyePipeline: GPUComputePipeline,
  injectVelocityPipeline: GPUComputePipeline,
  advectDyePipeline: GPUComputePipeline,
  decayDyePipeline: GPUComputePipeline,
  decayVelocityPipeline: GPUComputePipeline,
  divPipeline: GPUComputePipeline,
  pressurePipeline: GPUComputePipeline,
  subtractPressureGradientPipeline: GPUComputePipeline,
  decayPressurePipeline: GPUComputePipeline,
  advectVelocityPipeline: GPUComputePipeline,
  computeVorticityPipeline: GPUComputePipeline,
  addVorticityConfinementPipeline: GPUComputePipeline,
  enforceVelocityBoundaryPipeline: GPUComputePipeline,
  enforcePressureBoundaryPipeline: GPUComputePipeline
}

export interface BufferMap {
  [key: string]: GPUBuffer;
}

export interface BindGroupMap {
  [key: string]: GPUBindGroup;
}

export function startSimulation({ device, context, buffers, bindGroups, pipelines, mouseHandler, gridSize }:
{
  device: GPUDevice,
  context: GPUCanvasContext,
  buffers: BufferMap,
  bindGroups: BindGroupMap,
  pipelines: PipelineMap,
  mouseHandler: MouseHandler,
  gridSize: number
}
) {
  async function simulationLoop() {
    updateDeltaTime(device, buffers);

    // Velocity splat (force injection)
    if (mouseHandler.isMouseDown) {
      runVelComputePass();
      updateVelocityField();
    }

    // Viscosity (velocity decay)
    runDecayVelocityComputePass();

    // Advect velocity
    runAdvectVelocityPass();
    updateVelocityField();

    // Pressure projection (Jacobi + subtract + clear)
    resetDivergenceBuffer();
    runDivergenceComputePass();
    for (let i = 0; i < 20; i++) {
      runPressureComputePass();
      updatePressureField();

      runEnforcePressureBoundaryPass();
      updatePressureField();
    }

    // Subtract pressure gradient
    runSubtractPressureGradientComputePass();
    updatePressureField(); // gradient subtract

    // Clear pressure
    runDecayPressureComputePass();

    // Vorticity confinement
    runComputeVorticityComputePass();
    runAddVorticityConfinementComputePass();
    updateVelocityField();

    // Velocity boundary
    runEnforceVelocityBoundaryPass();
    updateVelocityField();

    // Dye splat
    if (mouseHandler.isMouseDown) {
      runInjectDyeComputePass();
      updateDyeField();
    }

    // Advect dye
    runAdvectDyeComputePass();
    updateDyeField();

    // Decay dye
    runDecayDyeComputePass();

    // Render
    render(device, context, pipelines.renderPipeline, getRenderBindGroup());
    requestAnimationFrame(simulationLoop);
  }

  const workgroupSize = 8;
  const dispatchSizeX = Math.ceil(gridSize / workgroupSize);
  const dispatchSizeY = Math.ceil(gridSize / workgroupSize);
  
  // Example: Wrapping the injection pass.
  function runInjectDyeComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.injectDyePipeline);
    // Reuse the mouse buffer for injection pos; injectionAmount is in its own uniform.
    passEncoder.setBindGroup(0, bindGroups.injectDyeBindGroup);
    passEncoder.dispatchWorkgroups(dispatchSizeX, dispatchSizeY);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }
  
  function runVelComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.injectVelocityPipeline);
    passEncoder.setBindGroup(0, bindGroups.injectVelocityBindGroup);
    passEncoder.dispatchWorkgroups(dispatchSizeX, dispatchSizeY);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  let lastFrameTime = performance.now();

  function updateDeltaTime(device: GPUDevice, buffers: BufferMap) {
    const currentTime = performance.now();
    let deltaTime = (currentTime - lastFrameTime) / 1000.0; // Convert ms → seconds
    lastFrameTime = currentTime;

    if (deltaTime > (1.0 / 60.0)) {
      deltaTime = (1.0 / 60.0);
    }

    const deltaTimeData = new Float32Array([deltaTime]);
    device.queue.writeBuffer(buffers.deltaTimeBuf, 0, deltaTimeData);
  }

  function runAdvectDyeComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.advectDyePipeline);
    passEncoder.setBindGroup(0, bindGroups.advectDyeBindGroup);
    passEncoder.dispatchWorkgroups(dispatchSizeX, dispatchSizeY);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  function runEnforceVelocityBoundaryPass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.enforceVelocityBoundaryPipeline);
    passEncoder.setBindGroup(0, bindGroups.enforceVelocityBoundaryBindGroup);
    passEncoder.dispatchWorkgroups(dispatchSizeX, dispatchSizeY);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  function runEnforcePressureBoundaryPass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.enforcePressureBoundaryPipeline);
    passEncoder.setBindGroup(0, bindGroups.enforcePressureBoundaryBindGroup);
    passEncoder.dispatchWorkgroups(dispatchSizeX, dispatchSizeY);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  function runDecayDyeComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.decayDyePipeline);
    passEncoder.setBindGroup(0, bindGroups.decayDyeBindGroup);
    passEncoder.dispatchWorkgroups(dispatchSizeX, dispatchSizeY);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  function runDecayVelocityComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.decayVelocityPipeline);
    passEncoder.setBindGroup(0, bindGroups.decayVelocityBindGroup);
    passEncoder.dispatchWorkgroups(dispatchSizeX, dispatchSizeY);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  function resetDivergenceBuffer() {
    const zeroData = new Float32Array(gridSize * gridSize).fill(0);
    device.queue.writeBuffer(buffers.divBuf, 0, zeroData);
}

  function runDivergenceComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.divPipeline);
    passEncoder.setBindGroup(0, bindGroups.divBindGroup);
    passEncoder.dispatchWorkgroups(dispatchSizeX, dispatchSizeY);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
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

  function runSubtractPressureGradientComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.subtractPressureGradientPipeline);
    passEncoder.setBindGroup(0, bindGroups.subtractPressureGradientBindGroup);
    passEncoder.dispatchWorkgroups(dispatchSizeX, dispatchSizeY);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  function runDecayPressureComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.decayPressurePipeline);
    passEncoder.setBindGroup(0, bindGroups.decayPressureBindGroup);
    passEncoder.dispatchWorkgroups(dispatchSizeX, dispatchSizeY);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  function runAdvectVelocityPass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.advectVelocityPipeline);
    passEncoder.setBindGroup(0, bindGroups.advectVelocityBindGroup);
    passEncoder.dispatchWorkgroups(dispatchSizeX, dispatchSizeY);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  function runComputeVorticityComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.computeVorticityPipeline);
    passEncoder.setBindGroup(0, bindGroups.computeVorticityBindGroup);
    passEncoder.dispatchWorkgroups(dispatchSizeX, dispatchSizeY);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  function runAddVorticityConfinementComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.addVorticityConfinementPipeline);
    passEncoder.setBindGroup(0, bindGroups.addVorticityConfinementBindGroup);
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

  function updatePressureField() {
    const commandEncoder = device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(
      buffers.pressureOutBuf,
      0,
      buffers.pressureBuf,
      0,
      buffers.pressureBuf.size
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
        { binding: 2, resource: { buffer: buffers.dyeFieldBuf } },
      ]
    });
  }
  
  simulationLoop();
}
