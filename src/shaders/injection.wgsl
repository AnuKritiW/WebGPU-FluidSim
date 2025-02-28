// injection.wgsl
@group(0) @binding(0) var<storage, read_write> dye: array<f32>;
@group(0) @binding(1) var<uniform> uMouse : vec4<f32>; // (posX, posY, velX, velY)
@group(0) @binding(2) var<uniform> injectionAmount: f32;
@group(0) @binding(3) var<uniform> uGridSize: vec2<f32>;

@compute @workgroup_size(8,8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  // get grid cell position from the workgroup index
  let pos = vec2<f32>(global_id.xy);

  // Bounds check
  if (pos.x >= uGridSize.x || pos.y >= uGridSize.y) {
    return;
  }

  // Compute the 1D index for buffers
  let index = u32(pos.x + pos.y * uGridSize.x);

  // Distance from cell to the injection position
  let injectionPosGrid = uMouse.xy * uGridSize;
  let dist = distance(pos, injectionPosGrid);

  // Define injection radius – within which injection occurs.
  let radius = 1.5;
  if (dist < radius) {
    // Use a weight so that cells nearer the injection point receive more dye.
    // let weight = 1.0 - (dist / radius);

    // Gaussian weight for smoother injection
    let weight = exp(- (dist * dist) / (radius * radius));

    // Add injection
    // blends the new injection to any existing dye values within a clamped range
    dye[index] = clamp(dye[index] + injectionAmount * weight, 0.0, 1.0);
  }
}