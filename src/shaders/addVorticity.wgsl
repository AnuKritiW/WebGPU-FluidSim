@group(0) @binding(0) var<storage, read_write> velocity: array<vec2<f32>>;
@group(0) @binding(1) var<storage, read> vorticityForce: array<vec2<f32>>;
@group(0) @binding(2) var<uniform> uGridSize: vec2<f32>;
@group(0) @binding(3) var<uniform> uVorticityScale: f32;

@compute @workgroup_size(8,8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let gridWidth: u32 = u32(uGridSize.x);
  let x: u32 = global_id.x;
  let y: u32 = global_id.y;

  if (x >= gridWidth || y >= u32(uGridSize.y)) {
    return;
  }

  let index: u32 = x + y * gridWidth;
  // Add the scaled vorticity force to the velocity field
  velocity[index] += vorticityForce[index] * uVorticityScale;
}
