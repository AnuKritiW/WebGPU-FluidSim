import renderShaderCode from "../shaders/render.wgsl?raw";

export function createShaderModule(device: GPUDevice) {
  // compiles WGSL shader code into WebGPU shader module
  return device.createShaderModule({ code: renderShaderCode });
}