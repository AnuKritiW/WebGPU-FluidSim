import { createShaderModule } from "./shaders";
import updateVelocityShaderCode from "../shaders/updateVel.wgsl?raw";

function createRenderPipeline(device: GPUDevice, format: GPUTextureFormat) {
  const shaderModule = createShaderModule(device);

  return device.createRenderPipeline({
    vertex: { module: shaderModule, entryPoint: "vs_main" },                          // positions the quad
    fragment: {module: shaderModule, entryPoint: "fs_main", targets: [{ format }]},   // colors the screen
    primitive: { topology: "triangle-strip" },                                        // rectangle made of two triangles
    layout: "auto",
  });
}

// TODO: create a compute pipeline
function createComputePipeline(device: GPUDevice, format: GPUTextureFormat) {
  // Create Compute Pipeline for `updateVelocity.wgsl`
  const velShaderModule = device.createShaderModule({ code: updateVelocityShaderCode });

  return device.createComputePipeline({
    compute: { module: velShaderModule, entryPoint: "main" },
    layout: "auto",
  });
}

export function createPipelines(device: GPUDevice, format: GPUTextureFormat) {
  const renderPipeline = createRenderPipeline(device, format);
  const velPipeline = createComputePipeline(device, format);

  return { renderPipeline, velPipeline };
}