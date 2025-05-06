import renderShaderCode from "../shaders/render.wgsl?raw";
import injectVelocityShaderCode from "../shaders/injectVelocity.wgsl?raw";
import advectDyeShaderCode from "../shaders/advectDye.wgsl?raw";
import decayDyeShaderCode from "../shaders/decayDye.wgsl?raw";
import decayVelocityShaderCode from "../shaders/decayVelocity.wgsl?raw";
import injectDyeShaderCode from "../shaders/injectDye.wgsl?raw";
import divShaderCode from "../shaders/divergence.wgsl?raw"
import pressureShaderCode from "../shaders/pressure.wgsl?raw"
import subPressureShaderCode from "../shaders/subPressure.wgsl?raw"
import advectVelocityShaderCode from "../shaders/advectVelocity.wgsl?raw"
import computeVorticityShaderCode from "../shaders/computeVorticity.wgsl?raw"
import addVorticityConfinementShaderCode from "../shaders/addVorticityConfinement.wgsl?raw"
import decayPressureShaderCode from "../shaders/decayPressure.wgsl?raw"
import enforceVelocityBoundaryShaderCode from "../shaders/enforceVelocityBoundary.wgsl?raw"
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

function createDecayDyeComputePipeline(device: GPUDevice) {
  const decayDyeShaderModule = device.createShaderModule({ code: decayDyeShaderCode });

  return device.createComputePipeline({
    compute: { module: decayDyeShaderModule, entryPoint: "main" },
    layout: "auto"
  });
}

function createDecayVelocityComputePipeline(device: GPUDevice) {
  const decayVelocityShaderModule = device.createShaderModule({ code: decayVelocityShaderCode });

  return device.createComputePipeline({
    compute: { module: decayVelocityShaderModule, entryPoint: "main" },
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

function createAdvectVelocityComputePipeline(device: GPUDevice) {
  const advectVelocityShaderModule = device.createShaderModule({ code: advectVelocityShaderCode });

  return device.createComputePipeline({
    compute: {module: advectVelocityShaderModule, entryPoint: "main" },
    layout: "auto"
  });
}

function createComputeVorticityComputePipeline(device: GPUDevice) {
  const computeVorticityShaderModule = device.createShaderModule({ code: computeVorticityShaderCode });

  return device.createComputePipeline({
    compute: {module: computeVorticityShaderModule, entryPoint: "main" },
    layout: "auto"
  });
}

function createAddVorticityConfinementComputePipeline(device: GPUDevice) {
  const addVorticityConfinementShaderModule = device.createShaderModule({ code: addVorticityConfinementShaderCode });

  return device.createComputePipeline({
    compute: {module: addVorticityConfinementShaderModule, entryPoint: "main" },
    layout: "auto"
  });
}

function decayPressureComputePipeline(device: GPUDevice) {
  const decayPressureShaderModule = device.createShaderModule({ code: decayPressureShaderCode });

  return device.createComputePipeline({
    compute: { module: decayPressureShaderModule, entryPoint: "main" },
    layout: "auto"
  });
}

function enforceVelocityBoundaryComputePipeline(device: GPUDevice) {
  const enforceVelocityBoundaryShaderModule = device.createShaderModule({ code: enforceVelocityBoundaryShaderCode });

  return device.createComputePipeline({
    compute: { module: enforceVelocityBoundaryShaderModule, entryPoint: "main" },
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
  const decayDyePipeline = createDecayDyeComputePipeline(device);
  const decayVelocityPipeline = createDecayVelocityComputePipeline(device);
  const injectDyePipeline = createInjectDyeComputePipeline(device);
  const divPipeline = createDivComputePipeline(device);
  const pressurePipeline = createPressureComputePipeline(device);
  const subPressurePipeline = createSubPressureComputePipeline(device);
  const advectVelocityPipeline = createAdvectVelocityComputePipeline(device);
  const computeVorticityPipeline = createComputeVorticityComputePipeline(device);
  const addVorticityConfinementPipeline = createAddVorticityConfinementComputePipeline(device);
  const decayPressurePipeline = decayPressureComputePipeline(device);
  const enforceVelocityBoundaryPipeline = enforceVelocityBoundaryComputePipeline(device);
  const presBoundaryPipeline = clearPresBoundaryComputePipeline(device);

  return { renderPipeline, injectVelocityPipeline, advectDyePipeline, decayDyePipeline, decayVelocityPipeline, injectDyePipeline,
           divPipeline, pressurePipeline, subPressurePipeline, advectVelocityPipeline, computeVorticityPipeline,
           addVorticityConfinementPipeline, decayPressurePipeline, enforceVelocityBoundaryPipeline, presBoundaryPipeline };
}