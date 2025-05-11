function createInjectVelocityBindGroup(device: GPUDevice, velPipeline: GPURenderPipeline, buffers: any) {
  return device.createBindGroup({
    layout: velPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.velBuf } },
      { binding: 1, resource: { buffer: buffers.mouseBuf } },
      { binding: 2, resource: { buffer: buffers.gridSizeBuf } },
      { binding: 3, resource: { buffer: buffers.radiusBuf } },
      { binding: 4, resource: { buffer: buffers.strengthBuf } },
      { binding: 5, resource: { buffer: buffers.deltaTimeBuf } },
      { binding: 6, resource: { buffer: buffers.velOutBuf } }
    ]
  });
}

function createAdvectDyeBindGroup(device: GPUDevice, advectionPipeline: GPURenderPipeline, buffers: any) {
  return device.createBindGroup({
    layout: advectionPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.velBuf } },
      { binding: 1, resource: { buffer: buffers.dyeFieldBuf } },
      { binding: 2, resource: { buffer: buffers.dyeFieldOutBuf } },
      { binding: 3, resource: { buffer: buffers.gridSizeBuf } },
      { binding: 4, resource: { buffer: buffers.deltaTimeBuf } }
    ]
  });
}

function createInjectDyeBindGroup(device: GPUDevice, injectionPipeline: GPURenderPipeline, buffers: any) {
  return device.createBindGroup({
    layout: injectionPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dyeFieldBuf } },
      { binding: 1, resource: { buffer: buffers.mouseBuf } },
      { binding: 2, resource: { buffer: buffers.injectionAmtBuf } },
      { binding: 3, resource: { buffer: buffers.gridSizeBuf } },
      { binding: 4, resource: { buffer: buffers.deltaTimeBuf } },
      { binding: 5, resource: { buffer: buffers.dyeFieldOutBuf } },
      { binding: 6, resource: { buffer: buffers.strengthBuf } },
      { binding: 7, resource: { buffer: buffers.radiusBuf } }
    ]
  });
}

function createDecayDyeBindGroup(device: GPUDevice, decayPipeline: GPURenderPipeline, buffers: any) {
  return device.createBindGroup({
    layout: decayPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.gridSizeBuf } },
      { binding: 1, resource: { buffer: buffers.dyeFieldBuf } },
      { binding: 2, resource: { buffer: buffers.dyeDecayBuf } }
    ]
  });
}

function createDecayVelocityBindGroup(device: GPUDevice, velDecayPipeline: GPURenderPipeline, buffers: any) {
  return device.createBindGroup({
    layout: velDecayPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.gridSizeBuf } },
      { binding: 1, resource: { buffer: buffers.velBuf } },
      { binding: 2, resource: { buffer: buffers.velDecayBuf } }
    ]
  });
}

function createDivBindGroup(device: GPUDevice, divPipeline: GPURenderPipeline, buffers: any) {
  return device.createBindGroup({
    layout: divPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.velBuf } },
      { binding: 1, resource: { buffer: buffers.divBuf } },
      { binding: 2, resource: { buffer: buffers.gridSizeBuf } }
    ]
  });
}

function createPressureBindGroup(device: GPUDevice, pressurePipeline: GPURenderPipeline, buffers: any) {
  return device.createBindGroup({
    layout: pressurePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.divBuf } },
      { binding: 1, resource: { buffer: buffers.pressureBuf } },
      { binding: 2, resource: { buffer: buffers.gridSizeBuf } },
      { binding: 3, resource: { buffer: buffers.pressureOutBuf } }
    ]
  });
}

function createSubtractPressureGradientBindGroup(device: GPUDevice, subtractPressureGradientPipeline: GPURenderPipeline, buffers: any) {
  return device.createBindGroup({
    layout: subtractPressureGradientPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.velBuf } },
      { binding: 1, resource: { buffer: buffers.pressureBuf } },
      { binding: 2, resource: { buffer: buffers.gridSizeBuf } }
    ]
  });
}

function createAdvectVelocityBindGroup(device: GPUDevice, advectVelPipeline: GPURenderPipeline, buffers: any) {
  return device.createBindGroup({
    layout: advectVelPipeline.getBindGroupLayout(0),
    entries: [
      {binding: 0, resource: { buffer: buffers.velBuf } },
      {binding: 1, resource: { buffer: buffers.velOutBuf } },
      {binding: 2, resource: { buffer: buffers.gridSizeBuf } },
      {binding: 3, resource: { buffer: buffers.deltaTimeBuf } }
    ]
  });
}

function createComputeVorticityBindGroup(device: GPUDevice, computeVorticityPipeline: GPURenderPipeline, buffers: any) {
  return device.createBindGroup({
    layout: computeVorticityPipeline.getBindGroupLayout(0),
    entries: [
      {binding: 0, resource: { buffer: buffers.velBuf } },
      {binding: 1, resource: { buffer: buffers.gridSizeBuf } },
      {binding: 2, resource: { buffer: buffers.vorticityBuf } }
    ]
  });
}

function createAddVorticityConfinementBindGroup(device: GPUDevice, addVorticityConfinementPipeline: GPURenderPipeline, buffers: any) {
  return device.createBindGroup({
    layout: addVorticityConfinementPipeline.getBindGroupLayout(0),
    entries: [
      {binding: 0, resource: { buffer: buffers.velBuf } },
      {binding: 1, resource: { buffer: buffers.vorticityBuf } },
      {binding: 2, resource: { buffer: buffers.gridSizeBuf } },
      {binding: 3, resource: { buffer: buffers.vorticityStrengthBuf } },
      {binding: 4, resource: { buffer: buffers.deltaTimeBuf } },
      {binding: 5, resource: { buffer: buffers.velOutBuf } }
    ]
  });
}


function createDecayPressureBindGroup(device: GPUDevice, decayPressurePipeline: GPURenderPipeline, buffers: any) {
  return device.createBindGroup({
    layout: decayPressurePipeline.getBindGroupLayout(0),
    entries: [
      {binding: 0, resource: { buffer: buffers.pressureBuf } },
      {binding: 1, resource: { buffer: buffers.gridSizeBuf } },
      {binding: 2, resource: { buffer: buffers.viscosityBuf } }
    ]
  });
}

function createEnforceVelocityBoundaryBindGroup(device: GPUDevice, enforceVelocityBoundaryPipeline: GPURenderPipeline, buffers: any) {
  return device.createBindGroup({
    layout: enforceVelocityBoundaryPipeline.getBindGroupLayout(0),
    entries: [
      {binding: 0, resource: { buffer: buffers.velBuf } },
      {binding: 1, resource: { buffer: buffers.velOutBuf } },
      {binding: 2, resource: { buffer: buffers.gridSizeBuf } }
    ]
  });
}

function createEnforcePressureBoundaryBindGroup(device: GPUDevice, enforcePressureBoundaryPipeline: GPURenderPipeline, buffers: any) {
  return device.createBindGroup({
    layout: enforcePressureBoundaryPipeline.getBindGroupLayout(0),
    entries: [
      {binding: 0, resource: { buffer: buffers.pressureBuf } },
      {binding: 1, resource: { buffer: buffers.pressureOutBuf } },
      {binding: 2, resource: { buffer: buffers.gridSizeBuf } }
    ]
  });
}

export function createBindGroups(device: GPUDevice, pipelines: any, buffers: any) {
  const injectVelocityBindGroup = createInjectVelocityBindGroup(device, pipelines.injectVelocityPipeline, buffers);
  const advectDyeBindGroup = createAdvectDyeBindGroup(device, pipelines.advectDyePipeline, buffers);
  const injectDyeBindGroup = createInjectDyeBindGroup(device, pipelines.injectDyePipeline, buffers);
  const decayDyeBindGroup = createDecayDyeBindGroup(device, pipelines.decayDyePipeline, buffers);
  const decayVelocityBindGroup = createDecayVelocityBindGroup(device, pipelines.decayVelocityPipeline, buffers);
  const divBindGroup = createDivBindGroup(device, pipelines.divPipeline, buffers);
  const pressureBindGroup = createPressureBindGroup(device, pipelines.pressurePipeline, buffers);
  const subtractPressureGradientBindGroup = createSubtractPressureGradientBindGroup(device, pipelines.subtractPressureGradientPipeline, buffers);
  const advectVelocityBindGroup = createAdvectVelocityBindGroup(device, pipelines.advectVelocityPipeline, buffers);
  const computeVorticityBindGroup = createComputeVorticityBindGroup(device, pipelines.computeVorticityPipeline, buffers);
  const addVorticityConfinementBindGroup = createAddVorticityConfinementBindGroup(device, pipelines.addVorticityConfinementPipeline, buffers);
  const decayPressureBindGroup = createDecayPressureBindGroup(device, pipelines.decayPressurePipeline, buffers);
  const enforceVelocityBoundaryBindGroup = createEnforceVelocityBoundaryBindGroup(device, pipelines.enforceVelocityBoundaryPipeline, buffers);
  const enforcePressureBoundaryBindGroup = createEnforcePressureBoundaryBindGroup(device, pipelines.enforcePressureBoundaryPipeline, buffers);

  return { injectVelocityBindGroup, advectDyeBindGroup, injectDyeBindGroup, decayDyeBindGroup, decayVelocityBindGroup, divBindGroup,
           pressureBindGroup, subtractPressureGradientBindGroup, advectVelocityBindGroup, computeVorticityBindGroup, 
           addVorticityConfinementBindGroup, decayPressureBindGroup, enforceVelocityBoundaryBindGroup, enforcePressureBoundaryBindGroup };
}