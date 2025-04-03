// Decay Compute Shader

@group(0) @binding(0) var<uniform> uGridSize: vec4<f32>;;
@group(0) @binding(1) var<storage, read_write> dye: array<f32>;
@group(0) @binding(2) var<uniform> decayRate: f32;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  // get grid cell position from the workgroup index
  let pos = vec2<f32>(global_id.xy);
  
  // Bounds check
  if (pos.x >= uGridSize.x || pos.y >= uGridSize.y) {
    return;
  }

  // Compute the 1D index for buffers
  let index = u32(pos.x + pos.y * uGridSize.x);

  let decayedDye = dye[index] * decayRate;
  dye[index] = select(decayedDye, 0.0, decayedDye < 0.01);
}