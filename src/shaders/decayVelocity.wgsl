// Velocity Decay compute shader
/* This shader applies exponential decay to the velocity field, simulating friction or air resistance over time.

   For each non-boundary grid cell:
     1. Scales the current velocity vector by a decay factor (`uVelocityDecayRate`).
     2. If the resulting velocity magnitude falls below a small threshold (`< 0.0001`), clamps it to zero.
     3. Writes the updated velocity back to the buffer.

   This helps stabilize the fluid by damping residual motion.
*/

@group(0) @binding(0) var<uniform> uGridSize: vec4<f32>;
@group(0) @binding(1) var<storage, read_write> velocity: array<vec2<f32>>;
@group(0) @binding(2) var<uniform> uVelocityDecayRate: f32;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  // get grid cell position from the workgroup index
  let x = global_id.x;
  let y = global_id.y;
  
  // Bounds check
  if (x == 0 || y == 0 || x >= (u32(uGridSize.x)) || y >= (u32(uGridSize.y))) {
    return;
  }
  let pos = vec2<f32>(global_id.xy);

  // Compute the 1D index for buffers
  let index = u32(pos.x + pos.y * uGridSize.x);

  let decayedVel = velocity[index] * uVelocityDecayRate;
  velocity[index] = select(decayedVel, vec2<f32>(0.0), length(decayedVel) < 0.0001);
}