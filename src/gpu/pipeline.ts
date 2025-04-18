import { createShaderModule } from "./shaders";
import updateVelocityShaderCode from "../shaders/updateVel.wgsl?raw";
import advectionShaderCode from "../shaders/advection.wgsl?raw";
import decayShaderCode from "../shaders/decay.wgsl?raw";
import injectionShaderCode from "../shaders/injection.wgsl?raw";

function createRenderPipeline(device: GPUDevice, format: GPUTextureFormat) {
  const shaderModule = createShaderModule(device);

  return device.createRenderPipeline({
    vertex: { module: shaderModule, entryPoint: "vs_main" },                          // positions the quad
    fragment: {module: shaderModule, entryPoint: "fs_main", targets: [{ format }]},   // colors the screen
    primitive: { topology: "triangle-strip" },                                        // rectangle made of two triangles
    layout: "auto"
  });
}

function createComputePipeline(device: GPUDevice, format: GPUTextureFormat) {
  // Create Compute Pipeline for `updateVelocity.wgsl`
  const velShaderModule = device.createShaderModule({ code: updateVelocityShaderCode });

  return device.createComputePipeline({
    compute: { module: velShaderModule, entryPoint: "main" },
    layout: "auto"
  });
}

function createAdvectionComputePipeline(device: GPUDevice, format: GPUTextureFormat) {
  const advectionShaderModule = device.createShaderModule({ code: advectionShaderCode });

  return device.createComputePipeline({
    compute: { module: advectionShaderModule, entryPoint: "main" },
    layout: "auto"
  })
}

function createDecayComputePipeline(device: GPUDevice, format: GPUTextureFormat) {
  const decayShaderModule = device.createShaderModule({ code: decayShaderCode });

  return device.createComputePipeline({
    compute: { module: decayShaderModule, entryPoint: "main" },
    layout: "auto"
  })
}

function createInjectionComputePipeline(device: GPUDevice, format: GPUTextureFormat) {
  const injectionShaderModule = device.createShaderModule({ code: injectionShaderCode });

  return device.createComputePipeline({
    compute: { module: injectionShaderModule, entryPoint: "main" },
    layout: "auto"
  })
}

export function createPipelines(device: GPUDevice, format: GPUTextureFormat) {
  const renderPipeline = createRenderPipeline(device, format);
  const velPipeline = createComputePipeline(device, format);
  const advectionPipeline = createAdvectionComputePipeline(device, format);
  const decayPipeline = createDecayComputePipeline(device, format);
  const injectionPipeline = createInjectionComputePipeline(device, format);

  return { renderPipeline, velPipeline, advectionPipeline, decayPipeline, injectionPipeline };
}