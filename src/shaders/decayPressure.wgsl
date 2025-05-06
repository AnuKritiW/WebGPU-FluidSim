@group(0) @binding(0) var<storage, read_write> pressure: array<f32>;
@group(0) @binding(1) var<uniform> uGridSize: vec4<f32>;
@group(0) @binding(2) var<uniform> uViscosity: f32;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  // Bounds check
  let x = global_id.x;
  let y = global_id.y;
  if (x == 0 || y == 0 || x >= (u32(uGridSize.x)) || y >= (u32(uGridSize.y))) {
    return;
  }

  // Compute the 1D index for buffers
  let index = x + y * u32(uGridSize.x);

  let decayedPressure = pressure[index] * uViscosity;
  pressure[index] = select(decayedPressure, 0.0, decayedPressure < 0.001);
}
