@group(0) @binding(0) var<storage, read> velocity: array<vec2<f32>>;
@group(0) @binding(1) var<uniform> uGridSize: vec4<f32>;
@group(0) @binding(2) var<storage, read_write> vorticity: array<f32>;

@compute @workgroup_size(8,8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let gridWidth = u32(uGridSize.x);
  let gridHeight: u32 = u32(uGridSize.y);

  let x: u32 = global_id.x;
  let y: u32 = global_id.y;

  // Bounds check
  if (x == 0 || y == 0 || x >= (u32(uGridSize.x)) || y >= (u32(uGridSize.y))) {
    return;
  }

  // Compute the 1D index for buffers
  let index: u32 = x + y * gridWidth;

  let leftIdx = (x - 1u) + y * gridWidth;
  let rightIdx = (x + 1u) + y * gridWidth;
  let bottomIdx = x + (y - 1u) * gridWidth;
  let topIdx = x + (y + 1u) * gridWidth;

  let leftVel = velocity[leftIdx].y;
  let rightVel = velocity[rightIdx].y;
  let bottomVel = velocity[bottomIdx].x;
  let topVel = velocity[topIdx].x;
  
  // Approximate curl (only z-component in 2D: curl = ∂v/∂x - ∂u/∂y)
  let curl = ((rightVel - leftVel) - (topVel - bottomVel));
  
  // Compute a confinement force that is proportional to the curl.
  vorticity[index] = 0.001 * uGridSize.w * curl;
}
