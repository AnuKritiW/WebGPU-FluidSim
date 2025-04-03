function createMouseBuf(device: GPUDevice) {
  return device.createBuffer({
    size: 4 * Float32Array.BYTES_PER_ELEMENT, // (posX, posY, velX, velY)
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
    // UNIFORM --> Allows read-only access to mouse pos and vel.
    // COPY_SRC --> Allows copying from this buffer.
    // COPY_DST --> Ensures we can update it from the CPU.
  });
}

function createVelBuf(device: GPUDevice, gridSize: number) {
  return device.createBuffer({
    size: gridSize * gridSize * 2 * Float32Array.BYTES_PER_ELEMENT, // vec2<f32> per grid cell
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
  });
}

function createVelOutBuf(device: GPUDevice, gridSize: number) {
  return device.createBuffer({
    size: gridSize * gridSize * 2 * Float32Array.BYTES_PER_ELEMENT, // vec2<f32> per grid cell
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
  });
}

function createGridSizeBuf(device: GPUDevice) {
  return device.createBuffer({
    size: 4 * Float32Array.BYTES_PER_ELEMENT, // vec4<f32>
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
}

function createRadBuf(device: GPUDevice) {
  return device.createBuffer({
    size: 4 * Float32Array.BYTES_PER_ELEMENT, // f32 padded to vec4<f32>
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
}

function createStrengthBuf(device: GPUDevice) {
  return device.createBuffer({
    size: 4 * Float32Array.BYTES_PER_ELEMENT, // f32 padded to vec4<f32>
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
}

function createDyeFieldBuf(device: GPUDevice, gridSize: number) {
  return device.createBuffer({
    size: gridSize * gridSize * 3 * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
  });
}

function createDyeFieldOutBuf(device: GPUDevice, gridSize: number) {
  return device.createBuffer({
    size: gridSize * gridSize * 3 * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
  });
}

function createDeltaTimeBuf(device: GPUDevice) {
  return device.createBuffer({
    size: 4 * Float32Array.BYTES_PER_ELEMENT, // f32 padded to vec4<f32>
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
}

function createDecayBuf(device: GPUDevice) {
  return device.createBuffer({
    size: 4 * Float32Array.BYTES_PER_ELEMENT, // f32 padded to vec4<f32>
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
}

function createVelDecayBuf(device: GPUDevice) {
  return device.createBuffer({
    size: 4 * Float32Array.BYTES_PER_ELEMENT, // f32 padded to vec4<f32>
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
}

function createInjectionAmtBuf(device: GPUDevice) {
  return device.createBuffer({
    size: 4 * Float32Array.BYTES_PER_ELEMENT, // f32 padded to vec4<32>
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
}

function createCanvasSizeBuf(device: GPUDevice) {
  return device.createBuffer({
    size: 4 * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
}

function createDivBuf(device: GPUDevice, gridSize: number) {
  return device.createBuffer({
    size: gridSize * gridSize * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
  });
}

function createPressureBuf(device: GPUDevice, gridSize: number) {
  return device.createBuffer({
    size: gridSize * gridSize * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
  });
}

function createPressureOutBuf(device: GPUDevice, gridSize: number) {
  return device.createBuffer({
    size: gridSize * gridSize * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
  });
}

function createVorticityBuf(device: GPUDevice, gridSize: number) {
  return device.createBuffer({
    size: gridSize * gridSize * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
  });
}

function createVorticityForceBuf(device: GPUDevice, gridSize: number) {
  return device.createBuffer({
    size: gridSize * gridSize * 2 * Float32Array.BYTES_PER_ELEMENT, // vec2<f32> per grid cell
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
  });
}

function createVorticityStrengthBuf(device: GPUDevice) {
  return device.createBuffer({
    size: 4 * Float32Array.BYTES_PER_ELEMENT, // f32 padded to vec4<f32>
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
}

function createAddVorticityScaleBuf(device: GPUDevice) {
  return device.createBuffer({
    size: 4 * Float32Array.BYTES_PER_ELEMENT, // f32 padded to vec4<f32>
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
}

function createViscosityBuf(device: GPUDevice) {
  return device.createBuffer({
    size: 4 * Float32Array.BYTES_PER_ELEMENT, // f32 padded to vec4<f32>
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
}

export function createBuffers(device: GPUDevice, gridSize: number, canvas) {
  const mouseBuf = createMouseBuf(device);
  const velBuf      = createVelBuf(device, gridSize);
  const velOutBuf = createVelOutBuf(device, gridSize);
  const gridSizeBuf = createGridSizeBuf(device);
  const radiusBuf   = createRadBuf(device);
  const strengthBuf = createStrengthBuf(device);
  const dyeFieldBuf = createDyeFieldBuf(device, gridSize);
  const dyeFieldOutBuf = createDyeFieldOutBuf(device, gridSize);
  const deltaTimeBuf = createDeltaTimeBuf(device);
  const injectionAmtBuf = createInjectionAmtBuf(device);
  const decayBuf = createDecayBuf(device);
  const velDecayBuf = createVelDecayBuf(device);
  const canvasSizeBuf = createCanvasSizeBuf(device);
  const divBuf = createDivBuf(device, gridSize);
  const pressureBuf = createPressureBuf(device, gridSize);
  const pressureOutBuf = createPressureOutBuf(device, gridSize);
  const vorticityBuf = createVorticityBuf(device, gridSize);
  const vorticityForceBuf = createVorticityForceBuf(device, gridSize);
  const vorticityStrengthBuf = createVorticityStrengthBuf(device);
  const vorticityScaleBuf = createAddVorticityScaleBuf(device);
  const viscosityBuf = createViscosityBuf(device);

  // Write initial values
  const injectionAmtData = new Float32Array([10.5, 0.5, 0.5 , 0.0]);
  device.queue.writeBuffer(injectionAmtBuf, 0, injectionAmtData);

  const dx = 1.0 / gridSize;
  const rdx = 1.0 / dx;
  const gridSizeData = new Float32Array([gridSize, gridSize, dx, rdx]);
  // TODO: adjust these parameters to see velocity injection more/less easily
  const radiusData   = new Float32Array([0.5, 0.0, 0.0, 0.0]); // f32 aligned
  const strengthData = new Float32Array([2.0, 0.0, 0.0, 0.0]); // f32 aligned

  device.queue.writeBuffer(gridSizeBuf, 0, gridSizeData);
  device.queue.writeBuffer(radiusBuf, 0, radiusData);
  device.queue.writeBuffer(strengthBuf, 0, strengthData);

  const decayData = new Float32Array([0.99, 0.0, 0.0, 0.0]); // f32 aligned
  device.queue.writeBuffer(decayBuf, 0, decayData);

  const velDecayData = new Float32Array([0.99, 0.0, 0.0, 0.0]); // f32 aligned
  device.queue.writeBuffer(velDecayBuf, 0, velDecayData);

  const canvasSizeData = new Float32Array([canvas.width, canvas.height]);
  device.queue.writeBuffer(canvasSizeBuf, 0, canvasSizeData);

  const vorticityStrengthData = new Float32Array([100000.0, 0.0, 0.0, 0.0]);
  device.queue.writeBuffer(vorticityStrengthBuf, 0, vorticityStrengthData);

  const vorticityScaleData = new Float32Array([100000.5, 0.0, 0.0, 0.0]);
  device.queue.writeBuffer(vorticityScaleBuf, 0, vorticityScaleData);

  const viscosityData = new Float32Array([0.8, 0.0, 0.0, 0.0]);
  device.queue.writeBuffer(viscosityBuf, 0, viscosityData);

  return {
    mouseBuf,
    velBuf,
    velOutBuf,
    gridSizeBuf,
    radiusBuf,
    strengthBuf,
    dyeFieldBuf,
    dyeFieldOutBuf,
    deltaTimeBuf,
    injectionAmtBuf,
    decayBuf,
    velDecayBuf,
    canvasSizeBuf,
    divBuf,
    pressureBuf,
    pressureOutBuf,
    vorticityBuf,
    vorticityForceBuf,
    vorticityStrengthBuf,
    vorticityScaleBuf,
    viscosityBuf
  };
}