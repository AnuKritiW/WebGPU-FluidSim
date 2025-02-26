export function render(device: GPUDevice, context: GPUCanvasContext, pipeline: GPURenderPipeline, renderBindGroup: GPUBindGroup) {
  const commandEncoder = device.createCommandEncoder();         // begins recording drawing commands
  const textureView = context.getCurrentTexture().createView(); // gets the canvas as a render target
  const passEncoder = commandEncoder.beginRenderPass({          // starts a new rendering step
    colorAttachments: [{
      view: textureView,
      loadOp: "clear",
      storeOp: "store",
      clearValue: [0, 0, 0, 1], // Black background
    }],
  });

  // draw quad
  passEncoder.setPipeline(pipeline); // tells WebGPU to use the shader
  passEncoder.setBindGroup(0, renderBindGroup); // Set the bind group for simulation data
  passEncoder.draw(4); // draws 4 verts for the quad
  passEncoder.end();
  device.queue.submit([commandEncoder.finish()]); // sends commands to GPU for execution
}