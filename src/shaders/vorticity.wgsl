@group(0) @binding(0) var<storage, read> velocity: array<vec2<f32>>;
@group(0) @binding(1) var<storage, read_write> vorticityForce: array<vec2<f32>>;
@group(0) @binding(2) var<uniform> uGridSize: vec2<f32>;
@group(0) @binding(3) var<uniform> vorticityStrength: f32;

@compute @workgroup_size(8,8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let gridWidth = u32(uGridSize.x);

  let x: u32 = global_id.x;
  let y: u32 = global_id.y;

  // Bounds check
  if (x >= gridWidth || y >= u32(uGridSize.y)) {
    return;
  }

  // Compute the 1D index for buffers
  let index = x + y * gridWidth;
  
  // Approximate curl (only z-component in 2D: curl = ∂v/∂x - ∂u/∂y)
  let left = select(velocity[index].y, velocity[index - 1u].y, (x > 0u));
  let right = select(velocity[index].y, velocity[index + 1u].y, (x < gridWidth - 1u));
  let top = select(velocity[index].x, velocity[index - gridWidth].x, (y > 0u));
  let bottom = select(velocity[index].x, velocity[index + gridWidth].x, (y < u32(uGridSize.y) - 1u));
  
  let curl = right - left - (bottom - top);
  
  // Compute a confinement force that is proportional to the curl.
  // TODO: compute grad of curl magnitude?
  let force = vec2<f32>(-curl, curl) * vorticityStrength;
  vorticityForce[index] = force;
}
