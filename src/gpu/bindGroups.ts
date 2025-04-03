function createVelBindGroup(device: GPUDevice, velPipeline: GPURenderPipeline, buffers: any) {
  return device.createBindGroup({
    layout: velPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.velBuf } },
      { binding: 1, resource: { buffer: buffers.mouseBuf } },
      { binding: 2, resource: { buffer: buffers.gridSizeBuf } },
      { binding: 3, resource: { buffer: buffers.radiusBuf } },
      { binding: 4, resource: { buffer: buffers.strengthBuf } },
      { binding: 5, resource: { buffer: buffers.deltaTimeBuf } }
    ]
  });
}

function createAdvectionBindGroup(device: GPUDevice, advectionPipeline: GPURenderPipeline, buffers: any) {
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

function createInjectionBindGroup(device: GPUDevice, injectionPipeline: GPURenderPipeline, buffers: any) {
  return device.createBindGroup({
    layout: injectionPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.dyeFieldBuf } },
      { binding: 1, resource: { buffer: buffers.mouseBuf } },
      { binding: 2, resource: { buffer: buffers.injectionAmtBuf } },
      { binding: 3, resource: { buffer: buffers.gridSizeBuf } }
    ]
  });
}

function createDecayBindGroup(device: GPUDevice, decayPipeline: GPURenderPipeline, buffers) {
  return device.createBindGroup({
    layout: decayPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.gridSizeBuf } },
      { binding: 1, resource: { buffer: buffers.dyeFieldBuf } },
      { binding: 2, resource: { buffer: buffers.decayBuf } }
    ]
  });
}

function createVelDecayBindGroup(device: GPUDevice, velDecayPipeline: GPURenderPipeline, buffers) {
  return device.createBindGroup({
    layout: velDecayPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.gridSizeBuf } },
      { binding: 1, resource: { buffer: buffers.velBuf } },
      { binding: 2, resource: { buffer: buffers.velDecayBuf } }
    ]
  });
}

function createDivBindGroup(device: GPUDevice, divPipeline: GPURenderPipeline, buffers) {
  return device.createBindGroup({
    layout: divPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.velBuf } },
      { binding: 1, resource: { buffer: buffers.divBuf } },
      { binding: 2, resource: { buffer: buffers.gridSizeBuf } }
    ]
  });
}

function createPressureBindGroup(device: GPUDevice, pressurePipeline: GPURenderPipeline, buffers) {
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

function createSubPressureBindGroup(device: GPUDevice, subPressurePipeline: GPURenderPipeline, buffers) {
  return device.createBindGroup({
    layout: subPressurePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.velBuf } },
      { binding: 1, resource: { buffer: buffers.pressureBuf } },
      { binding: 2, resource: { buffer: buffers.gridSizeBuf } }
    ]
  });
}

function createAdvectVelBindGroup(device: GPUDevice, advectVelPipeline: GPURenderPipeline, buffers) {
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

function createVoticityBindGroup(device: GPUDevice, vorticityPipeline: GPURenderPipeline, buffers) {
  return device.createBindGroup({
    layout: vorticityPipeline.getBindGroupLayout(0),
    entries: [
      {binding: 0, resource: { buffer: buffers.velBuf } },
      {binding: 1, resource: { buffer: buffers.gridSizeBuf } },
      {binding: 2, resource: { buffer: buffers.vorticityBuf } }
    ]
  });
}

function createAddVoticityBindGroup(device: GPUDevice, addVorticityPipeline: GPURenderPipeline, buffers) {
  return device.createBindGroup({
    layout: addVorticityPipeline.getBindGroupLayout(0),
    entries: [
      {binding: 0, resource: { buffer: buffers.velBuf } },
      {binding: 1, resource: { buffer: buffers.vorticityBuf } },
      {binding: 2, resource: { buffer: buffers.gridSizeBuf } },
      {binding: 3, resource: { buffer: buffers.vorticityStrengthBuf } },
      {binding: 4, resource: { buffer: buffers.deltaTimeBuf } }
    ]
  });
}


function createClearPressureBindGroup(device: GPUDevice, clearPressurePipeline: GPURenderPipeline, buffers) {
  return device.createBindGroup({
    layout: clearPressurePipeline.getBindGroupLayout(0),
    entries: [
      {binding: 0, resource: { buffer: buffers.pressureBuf } },
      {binding: 1, resource: { buffer: buffers.pressureOutBuf } },
      {binding: 2, resource: { buffer: buffers.gridSizeBuf } },
      {binding: 3, resource: { buffer: buffers.viscosityBuf } }
    ]
  });
}

export function createBindGroups(device: GPUDevice, pipelines: any, buffers: any) {
  const velBindGroup = createVelBindGroup(device, pipelines.velPipeline, buffers);
  const advectionBindGroup = createAdvectionBindGroup(device, pipelines.advectionPipeline, buffers);
  const injectionBindGroup = createInjectionBindGroup(device, pipelines.injectionPipeline, buffers);
  const decayBindGroup = createDecayBindGroup(device, pipelines.decayPipeline, buffers);
  const velDecayBindGroup = createVelDecayBindGroup(device, pipelines.velDecayPipeline, buffers);
  const divBindGroup = createDivBindGroup(device, pipelines.divPipeline, buffers);
  const pressureBindGroup = createPressureBindGroup(device, pipelines.pressurePipeline, buffers);
  const subPressureBindGroup = createSubPressureBindGroup(device, pipelines.subPressurePipeline, buffers);
  const advectVelBindGroup = createAdvectVelBindGroup(device, pipelines.advectVelPipeline, buffers);
  const vorticityBindGroup = createVoticityBindGroup(device, pipelines.vorticityPipeline, buffers);
  const addVorticityBindGroup = createAddVoticityBindGroup(device, pipelines.addVorticityPipeline, buffers);
  const clearPressureBindGroup = createClearPressureBindGroup(device, pipelines.clearPressurePipeline, buffers);

  return { velBindGroup, advectionBindGroup, injectionBindGroup, decayBindGroup, velDecayBindGroup, divBindGroup,
           pressureBindGroup, subPressureBindGroup, advectVelBindGroup, vorticityBindGroup, 
           addVorticityBindGroup, clearPressureBindGroup };
}