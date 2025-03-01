export function createMouseBuffer(device: GPUDevice) {
  return device.createBuffer({
    size: 4 * Float32Array.BYTES_PER_ELEMENT, // (posX, posY, velX, velY)
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
    // UNIFORM --> Allows read-only access to mouse pos and vel.
    // COPY_SRC --> Allows copying from this buffer.
    // COPY_DST --> Ensures we can update it from the CPU.
  });
}

export function createVelBuffer(device: GPUDevice, gridSize = number) {
  return device.createBuffer({
    size: gridSize * gridSize * 2 * Float32Array.BYTES_PER_ELEMENT, // vec2<f32> per grid cell
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
  });
}

export function createGridSizeBuffer(device: GPUDevice) {
  return device.createBuffer({
    size: 2 * Float32Array.BYTES_PER_ELEMENT, // vec2<f32>
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
}

export function createRadBuffer(device: GPUDevice) {
  return device.createBuffer({
    size: 4 * Float32Array.BYTES_PER_ELEMENT, // f32 padded to vec4<f32>
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
}

export function createStrengthBuffer(device: GPUDevice) {
  return device.createBuffer({
    size: 4 * Float32Array.BYTES_PER_ELEMENT, // f32 padded to vec4<f32>
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
}

export function createDyeFieldBuffer(device: GPUDevice, gridSize = number) {
  return device.createBuffer({
    size: gridSize * gridSize * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
  });
}

export function createDyeFieldOutBuffer(device: GPUDevice, gridSize = number) {
  return device.createBuffer({
    size: gridSize * gridSize * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
  });
}

export function createDeltaTimeBuffer(device: GPUDevice) {
  return device.createBuffer({
    size: 4 * Float32Array.BYTES_PER_ELEMENT, // f32 padded to vec4<f32>
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
}

export function createDecayBuffer(device: GPUDevice) {
  return device.createBuffer({
    size: 4 * Float32Array.BYTES_PER_ELEMENT, // f32 padded to vec4<f32>
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
}

export function createInjectionAmtBuffer(device: GPUDevice) {
  return device.createBuffer({
    size: 4 * Float32Array.BYTES_PER_ELEMENT, // f32 padded to vec4<32>
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
}