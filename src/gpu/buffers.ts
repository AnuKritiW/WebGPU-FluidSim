export function createMouseBuffer(device: GPUDevice) {
  return device.createBuffer({
    size: 4 * Float32Array.BYTES_PER_ELEMENT, // (posX, posY, velX, velY)
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    // UNIFORM --> Allows read-only access to mouse pos and vel.
    // COPY_SRC --> Allows copying from this buffer.
    // COPY_DST --> Ensures we can update it from the CPU.
  });
}