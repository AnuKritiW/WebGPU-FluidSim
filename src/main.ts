import './style.css'

async function initWebGPU() {
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  document.body.appendChild(canvas);

  const statusElement = document.getElementById("gpu-status");

  if (!navigator.gpu) {
    console.error("WebGPU not supported on this browser.");
    if (statusElement) statusElement.innerText = "WebGPU not supported!";
    return;
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.");
  }
  
  const device = await adapter?.requestDevice();

  if (!device) {
    console.error("Failed to get WebGPU device.");
    if (statusElement) statusElement.innerText = "Failed to initialize WebGPU!";
    return;
  }

  console.log("WebGPU initialized successfully!");
  if (statusElement) statusElement.innerText = "WebGPU is working!";

  const context = canvas.getContext("webgpu");
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat(); // The best color format for this browser.
  context.configure({
    device: device, 
    format: canvasFormat,
  });

  const shaderCode = `
    @vertex
    // defines full screen quad positions
    fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
      let pos = array(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>( 1.0, -1.0),
        vec2<f32>(-1.0,  1.0),
        vec2<f32>( 1.0,  1.0),
      );
      return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
    }

    @fragment
    fn fs_main() -> @location(0) vec4<f32> {
      return vec4<f32>(0.0, 0.0, 1.0, 1.0); // blue screen
    }
  `;

  // compiles WGSL shader code into WebGPU shader module
  const shaderModule = device.createShaderModule({ code: shaderCode });

  const pipeline = device.createRenderPipeline({
    vertex: { module: shaderModule, entryPoint: "vs_main" },                                        // positions the quad
    fragment: {module: shaderModule, entryPoint: "fs_main", targets: [{ format: canvasFormat }]},   // colors the screen
    primitive: { topology: "triangle-strip" },                                                      // rectangle made of two triangles
    layout: "auto",
  });

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
initWebGPU();
