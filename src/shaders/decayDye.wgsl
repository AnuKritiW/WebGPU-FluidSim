// Dye Decay compute shader
/* This shader applies exponential decay to the dye field, simulating natural dissipation over time.

   For each non-boundary grid cell:
     1. Reads the current dye value.
     2. Multiplies it by a user-defined decay rate (`uDyeDecayRate`).
     3. Writes the result back to the same location in the dye buffer.

   This step helps prevent dye from building up indefinitely in the simulation.
*/

@group(0) @binding(0) var<uniform> uGridSize: vec4<f32>;;
@group(0) @binding(1) var<storage, read_write> dye: array<vec3<f32>>;
@group(0) @binding(2) var<uniform> uDyeDecayRate: f32;

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

  let decayedDye = dye[index] * uDyeDecayRate;
  dye[index] = decayedDye;
}