// injection.wgsl
@group(0) @binding(0) var<storage, read> dye: array<f32>;
@group(0) @binding(1) var<uniform> uMouse : vec4<f32>; // (posX, posY, velX, velY)
@group(0) @binding(2) var<uniform> injectionAmount: f32;
@group(0) @binding(3) var<uniform> uGridSize: vec4<f32>; // (gridWidth, gridHeight, dx, rdx)
@group(0) @binding(4) var<uniform> uDeltaTime : f32;
@group(0) @binding(5) var<uniform> uDiffusion : f32;
@group(0) @binding(6) var<storage, read_write> dyeOut: array<f32>;


// Gaussian function for splatting dye influence
fn gaussianWeight(pos: vec2<f32>, center: vec2<f32>, vel: vec2<f32>, rad: f32) -> f32 {
  var diff = pos - center;
  diff.x *= uGridSize.x / uGridSize.y; // aspect correction
  var v = vel;
  v.x *= uGridSize.x / uGridSize.y; // aspect correction for direction
  // divide by radius if you want a sharper falloff (as opposed to radius^2)
  let distSq = dot(diff, diff);
  // optimize by pre-computing the inverse of radius squared
  let invRad = 1.0 / rad;
  return exp(-distSq * invRad) * length(v);
}

@compute @workgroup_size(8,8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {

  if (uMouse.z == 0.0 && uMouse.w == 0.0) {
    return;
  }

  // Bounds check
  let x = global_id.x;
  let y = global_id.y;
  if (x >= u32(uGridSize.x) || y >= u32(uGridSize.y)) {
    return;
  }

  // Compute the 1D index for buffers
  let index = x + y * u32(uGridSize.x);

  // get grid cell position from the workgroup index
  let pos = vec2<f32>(f32(x), f32(y)) / uGridSize.xy;

  // Distance from cell to the injection position
  let mousePos = uMouse.xy;
  let mouseVel = uMouse.zw;

  // Define injection radius in grid units – within which injection occurs.
  let radius = 0.0005;

  // Gaussian weight for smoother injection
  let weight = gaussianWeight(pos, mousePos, mouseVel, radius);

  // Add injection
  // blends the new injection to any existing dye values within a clamped range
  // clamped range avoids overflow
  dyeOut[index] = clamp(dye[index] * uDiffusion + injectionAmount * weight * uDeltaTime * 1000.0, 0.0, 1.0);
}