// Decay Compute Shader

@group(0) @binding(0) var<uniform> uGridSize: vec4<f32>;;
@group(0) @binding(1) var<storage, read_write> dye: array<vec3<f32>>;
@group(0) @binding(2) var<uniform> decayRate: f32;

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

  // get grid cell position from the workgroup index
  let pos = vec2<f32>(f32(x), f32(y));

  let decayedDye = dye[index] * decayRate;
  let threshold = vec3<f32>(0.01);
  dye[index] = select(decayedDye, vec3<f32>(0.0), decayedDye < threshold);
  // dye[index] = select(decayedDye, 0.0, decayedDye < 0.01);
}