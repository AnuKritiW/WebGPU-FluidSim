import './style.css'
import { initWebGPU } from "./gpu/device";
import { createRenderPipeline } from './gpu/pipeline';

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
  function render() {
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
    passEncoder.draw(4); // draws 4 verts for the quad
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]); // sends commands to GPU for execution
  }

  render();

}

// Call WebGPU initialization
main();
