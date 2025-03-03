import renderShaderCode from "../shaders/render.wgsl?raw";
import updateVelocityShaderCode from "../shaders/updateVel.wgsl?raw";
import advectionShaderCode from "../shaders/advection.wgsl?raw";
import decayShaderCode from "../shaders/decay.wgsl?raw";
import injectionShaderCode from "../shaders/injection.wgsl?raw";
import divShaderCode from "../shaders/divergence.wgsl?raw"
import pressureShaderCode from "../shaders/pressure.wgsl?raw"
import subPressureShaderCode from "../shaders/subPressure.wgsl?raw"
import velAdvectionShaderCode from "../shaders/velAdvection.wgsl?raw"
import vorticityShaderCode from "../shaders/vorticity.wgsl?raw"
import addVorticityShaderCode from "../shaders/addVorticity.wgsl?raw"

function createRenderPipeline(device: GPUDevice, format: GPUTextureFormat) {
  const shaderModule = device.createShaderModule({code: renderShaderCode});

  return device.createRenderPipeline({
    vertex: { module: shaderModule, entryPoint: "vs_main" },                          // positions the quad
    fragment: {module: shaderModule, entryPoint: "fs_main", targets: [{ format }]},   // colors the screen
    primitive: { topology: "triangle-strip" },                                        // rectangle made of two triangles
    layout: "auto"
  });
}

function createComputePipeline(device: GPUDevice) {
  // Create Compute Pipeline for `updateVelocity.wgsl`
  const velShaderModule = device.createShaderModule({ code: updateVelocityShaderCode });

  return device.createComputePipeline({
    compute: { module: velShaderModule, entryPoint: "main" },
    layout: "auto"
  });
}

function createAdvectionComputePipeline(device: GPUDevice) {
  const advectionShaderModule = device.createShaderModule({ code: advectionShaderCode });

  return device.createComputePipeline({
    compute: { module: advectionShaderModule, entryPoint: "main" },
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

function createInjectionComputePipeline(device: GPUDevice) {
  const injectionShaderModule = device.createShaderModule({ code: injectionShaderCode });

  return device.createComputePipeline({
    compute: { module: injectionShaderModule, entryPoint: "main" },
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

export function createPipelines(device: GPUDevice, format: GPUTextureFormat) {
  const renderPipeline = createRenderPipeline(device, format);
  const velPipeline = createComputePipeline(device);
  const advectionPipeline = createAdvectionComputePipeline(device);
  const decayPipeline = createDecayComputePipeline(device);
  const injectionPipeline = createInjectionComputePipeline(device);
  const divPipeline = createDivComputePipeline(device);
  const pressurePipeline = createPressureComputePipeline(device);
  const subPressurePipeline = createSubPressureComputePipeline(device);
  const advectVelPipeline = createAdvectVelComputePipeline(device);
  const vorticityPipeline = createVorticityComputePipeline(device);
  const addVorticityPipeline = createAddVorticityComputePipeline(device);

  return { renderPipeline, velPipeline, advectionPipeline, decayPipeline, injectionPipeline,
           divPipeline, pressurePipeline, subPressurePipeline, advectVelPipeline, vorticityPipeline,
           addVorticityPipeline };
}