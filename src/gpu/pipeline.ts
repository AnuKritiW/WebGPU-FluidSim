import renderShaderCode from "../shaders/render.wgsl?raw";
import injectVelocityShaderCode from "../shaders/injectVelocity.wgsl?raw";
import advectDyeShaderCode from "../shaders/advectDye.wgsl?raw";
import decayShaderCode from "../shaders/decay.wgsl?raw";
import velDecayShaderCode from "../shaders/velDecay.wgsl?raw";
import injectDyeShaderCode from "../shaders/injectDye.wgsl?raw";
import divShaderCode from "../shaders/divergence.wgsl?raw"
import pressureShaderCode from "../shaders/pressure.wgsl?raw"
import subPressureShaderCode from "../shaders/subPressure.wgsl?raw"
import velAdvectionShaderCode from "../shaders/velAdvection.wgsl?raw"
import vorticityShaderCode from "../shaders/vorticity.wgsl?raw"
import addVorticityShaderCode from "../shaders/addVorticity.wgsl?raw"
import clearPressureShaderCode from "../shaders/clearPressure.wgsl?raw"
import velBoundaryShaderCode from "../shaders/velBoundary.wgsl?raw"
import presBoundaryShaderCode from "../shaders/presBoundary.wgsl?raw"

function createRenderPipeline(device: GPUDevice, format: GPUTextureFormat) {
  const shaderModule = device.createShaderModule({code: renderShaderCode});

  return device.createRenderPipeline({
    vertex: { module: shaderModule, entryPoint: "vs_main" },                          // positions the quad
    fragment: {module: shaderModule, entryPoint: "fs_main", targets: [{ format }]},   // colors the screen
    primitive: { topology: "triangle-strip" },                                        // rectangle made of two triangles
    layout: "auto"
  });
}

function createInjectVelocityComputePipeline(device: GPUDevice) {
  // Create Compute Pipeline for `injectVelocity.wgsl`
  const injectVelocityShaderModule = device.createShaderModule({ code: injectVelocityShaderCode });

  return device.createComputePipeline({
    compute: { module: injectVelocityShaderModule, entryPoint: "main" },
    layout: "auto"
  });
}

function createAdvectDyeComputePipeline(device: GPUDevice) {
  const advectDyeShaderModule = device.createShaderModule({ code: advectDyeShaderCode });

  return device.createComputePipeline({
    compute: { module: advectDyeShaderModule, entryPoint: "main" },
    layout: "auto"
  });
}

function createDecayComputePipeline(device: GPUDevice) {
  const decayShaderModule = device.createShaderModule({ code: decayShaderCode });

  return device.createComputePipeline({
    compute: { module: decayShaderModule, entryPoint: "main" },
    layout: "auto"
  });
}

function createVelDecayComputePipeline(device: GPUDevice) {
  const velDecayShaderModule = device.createShaderModule({ code: velDecayShaderCode });

  return device.createComputePipeline({
    compute: { module: velDecayShaderModule, entryPoint: "main" },
    layout: "auto"
  });
}

function createInjectDyeComputePipeline(device: GPUDevice) {
  const injectDyeShaderModule = device.createShaderModule({ code: injectDyeShaderCode });

  return device.createComputePipeline({
    compute: { module: injectDyeShaderModule, entryPoint: "main" },
    layout: "auto"
  });
}

function createDivComputePipeline(device: GPUDevice) {
  const divShaderModule = device.createShaderModule({ code: divShaderCode });

  return device.createComputePipeline({
    compute: {module: divShaderModule, entryPoint: "main" },
    layout: "auto"
  });
}

function createPressureComputePipeline(device: GPUDevice) {
  const pressureShaderModule = device.createShaderModule({ code: pressureShaderCode });

  return device.createComputePipeline({
    compute: {module: pressureShaderModule, entryPoint: "main" },
    layout: "auto"
  });
}

function createSubPressureComputePipeline(device: GPUDevice) {
  const subPressureShaderModule = device.createShaderModule({ code: subPressureShaderCode });

  return device.createComputePipeline({
    compute: {module: subPressureShaderModule, entryPoint: "main" },
    layout: "auto"
  });
}

function createAdvectVelComputePipeline(device: GPUDevice) {
  const advectVelShaderModule = device.createShaderModule({ code: velAdvectionShaderCode });

  return device.createComputePipeline({
    compute: {module: advectVelShaderModule, entryPoint: "main" },
    layout: "auto"
  });
}

function createVorticityComputePipeline(device: GPUDevice) {
  const vorticityShaderModule = device.createShaderModule({ code: vorticityShaderCode });

  return device.createComputePipeline({
    compute: {module: vorticityShaderModule, entryPoint: "main" },
    layout: "auto"
  });
}

function createAddVorticityComputePipeline(device: GPUDevice) {
  const addVorticityShaderModule = device.createShaderModule({ code: addVorticityShaderCode });

  return device.createComputePipeline({
    compute: {module: addVorticityShaderModule, entryPoint: "main" },
    layout: "auto"
  });
}

function clearPressureComputePipeline(device: GPUDevice) {
  const clearPressureShaderModule = device.createShaderModule({ code: clearPressureShaderCode });

  return device.createComputePipeline({
    compute: { module: clearPressureShaderModule, entryPoint: "main" },
    layout: "auto"
  });
}

function clearVelBoundaryComputePipeline(device: GPUDevice) {
  const velBoundaryShaderModule = device.createShaderModule({ code: velBoundaryShaderCode });

  return device.createComputePipeline({
    compute: { module: velBoundaryShaderModule, entryPoint: "main" },
    layout: "auto"
  });
}

function clearPresBoundaryComputePipeline(device: GPUDevice) {
  const presBoundaryShaderModule = device.createShaderModule({ code: presBoundaryShaderCode });

  return device.createComputePipeline({
    compute: { module: presBoundaryShaderModule, entryPoint: "main" },
    layout: "auto"
  });
}

export function createPipelines(device: GPUDevice, format: GPUTextureFormat) {
  const renderPipeline = createRenderPipeline(device, format);
  const injectVelocityPipeline = createInjectVelocityComputePipeline(device);
  const advectDyePipeline = createAdvectDyeComputePipeline(device);
  const decayPipeline = createDecayComputePipeline(device);
  const velDecayPipeline = createVelDecayComputePipeline(device);
  const injectDyePipeline = createInjectDyeComputePipeline(device);
  const divPipeline = createDivComputePipeline(device);
  const pressurePipeline = createPressureComputePipeline(device);
  const subPressurePipeline = createSubPressureComputePipeline(device);
  const advectVelPipeline = createAdvectVelComputePipeline(device);
  const vorticityPipeline = createVorticityComputePipeline(device);
  const addVorticityPipeline = createAddVorticityComputePipeline(device);
  const clearPressurePipeline = clearPressureComputePipeline(device);
  const velBoundaryPipeline = clearVelBoundaryComputePipeline(device);
  const presBoundaryPipeline = clearPresBoundaryComputePipeline(device);

  return { renderPipeline, injectVelocityPipeline, advectDyePipeline, decayPipeline, velDecayPipeline, injectDyePipeline,
           divPipeline, pressurePipeline, subPressurePipeline, advectVelPipeline, vorticityPipeline,
           addVorticityPipeline, clearPressurePipeline, velBoundaryPipeline, presBoundaryPipeline };
}