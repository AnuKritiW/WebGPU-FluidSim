import { render } from './renderer';

export function startSimulation({ device, context, buffers, bindGroups, pipelines, mouseHandler }) {
  const gridSize = 64;  
  async function simulationLoop() {
    // If the mouse is down, run injection pass.
    if (mouseHandler.isMouseDown) {
      runInjectionComputePass();
    }

    runComputePass();
    runAdvectionComputePass();
    updateDyeField();
    runDecayComputePass();
    runDivergenceComputePass()

    render(device, context, pipelines.renderPipeline, getRenderBindGroup());

    requestAnimationFrame(simulationLoop);
  }
  
  // Example: Wrapping the injection pass.
  function runInjectionComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.injectionPipeline);
    // Reuse the mouse buffer for injection pos; injectionAmount is in its own uniform.
    passEncoder.setBindGroup(0, bindGroups.injectionBindGroup);
    passEncoder.dispatchWorkgroups(gridSize / 8, gridSize / 8);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }
  
  function runComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.velPipeline);
    passEncoder.setBindGroup(0, bindGroups.velBindGroup);
    passEncoder.dispatchWorkgroups(gridSize / 8, gridSize / 8);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }
  
  function runAdvectionComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.advectionPipeline);
    passEncoder.setBindGroup(0, bindGroups.advectionBindGroup);
    passEncoder.dispatchWorkgroups(gridSize / 8, gridSize / 8);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }
  
  function runDecayComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.decayPipeline);
    passEncoder.setBindGroup(0, bindGroups.decayBindGroup);
    passEncoder.dispatchWorkgroups(gridSize / 8, gridSize / 8);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }

  function runDivergenceComputePass() {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipelines.divPipeline);
    passEncoder.setBindGroup(0, bindGroups.divBindGroup);
    passEncoder.dispatchWorkgroups(gridSize / 8, gridSize / 8);
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
  
  simulationLoop();
}
