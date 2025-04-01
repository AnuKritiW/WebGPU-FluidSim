// injection.wgsl
@group(0) @binding(0) var<storage, read_write> dye: array<f32>;
@group(0) @binding(1) var<uniform> uMouse : vec4<f32>; // (posX, posY, velX, velY)
@group(0) @binding(2) var<uniform> injectionAmount: f32;
@group(0) @binding(3) var<uniform> uGridSize: vec4<f32>; // (gridWidth, gridHeight, dx, rdx)

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
  let pos = vec2<f32>(f32(x), f32(y));

  // Distance from cell to the injection position
  let injectionPosGrid = uMouse.xy * uGridSize.xy; // convert mouse position to grid space coordinates
  // let injectionPosGrid = vec2<f32>(uGridSize.x * 0.5, uGridSize.y * 0.5); // debug: center of the grid

  // since (canvas size) != (grid size), compute aspect-corrected offset to ensure splat is not distorted
  let diff = pos - injectionPosGrid;
  let aspect = uGridSize.x / uGridSize.y;
  let adjDiff = vec2<f32>(diff.x * aspect, diff.y);
  let distSquared = dot(adjDiff, adjDiff);

  // Define injection radius in grid units – within which injection occurs.
  let radius = 2.5;

  // Gaussian weight for smoother injection --> weight = exp(-distSquared / (radius * radius));
  // optimize by pre-computing the inverse of radius squared
  let invRadiusSquared = 1.0 / (radius * radius);
  let weight = exp(-distSquared * invRadiusSquared);

  // Add injection
  // blends the new injection to any existing dye values within a clamped range
  // clamped range avoids overflow
  dye[index] = clamp(dye[index] + injectionAmount * weight, 0.0, 1.0);
}