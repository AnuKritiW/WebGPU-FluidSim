import { createShaderModule } from "./shaders";

export function createRenderPipeline(device: GPUDevice, format: GPUTextureFormat) {
  const shaderModule = createShaderModule(device);

  return device.createRenderPipeline({
    vertex: { module: shaderModule, entryPoint: "vs_main" },                          // positions the quad
    fragment: {module: shaderModule, entryPoint: "fs_main", targets: [{ format }]},   // colors the screen
    primitive: { topology: "triangle-strip" },                                        // rectangle made of two triangles
    layout: "auto",
  });
}