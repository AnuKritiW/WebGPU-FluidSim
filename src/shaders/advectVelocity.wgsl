// Velocity Advection compute shader
/* This shader performs semi-Lagrangian advection of the velocity field itself.
   Each velocity vector is updated by tracing backward through the field to determine where it came from.

   For each non-boundary grid cell:
     1. Reads the velocity vector at the current cell.
     2. Computes the backtraced position using Euler integration (`pos - velocity * dt * rdx`).
     3. Uses bilinear interpolation to sample the velocity field at the backtraced position.
     4. Writes the result to the output buffer (`velocityOut`) for use in the next simulation step.
*/

@group(0) @binding(0) var<storage, read> velocityIn: array<vec2<f32>>;
@group(0) @binding(1) var<storage, read_write> velocityOut: array<vec2<f32>>;
@group(0) @binding(2) var<uniform> uGridSize: vec4<f32>;;
@group(0) @binding(3) var<uniform> uDeltaTime: f32;

// Bilinear sampling in velocity advection:
fn sampleVelocity(pos: vec2<f32>) -> vec2<f32> {
  let gridMax = uGridSize.xy - vec2(1.0);

  // Clamp the position to ensure interpolation stays in bounds
  let clampedPos = clamp(pos, vec2(0.0), gridMax);

  let x0 = floor(clampedPos.x);
  let y0 = floor(clampedPos.y);
  let x1 = x0 + 1.0;
  let y1 = y0 + 1.0;

  let fx = clampedPos.x - x0;
  let fy = clampedPos.y - y0;

  let i0 = u32(x0 + y0 * uGridSize.x);
  let i1 = u32(x1 + y0 * uGridSize.x);
  let i2 = u32(x0 + y1 * uGridSize.x);
  let i3 = u32(x1 + y1 * uGridSize.x);

  let v0 = velocityIn[i0];
  let v1 = velocityIn[i1];
  let v2 = velocityIn[i2];
  let v3 = velocityIn[i3];

  let interpX0 = mix(v0, v1, fx);
  let interpX1 = mix(v2, v3, fx);
  return mix(interpX0, interpX1, fy);
}

@compute @workgroup_size(8,8)
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
  
  let v = velocityIn[index];
  
  // Compute the backtraced position (semi-Lagrangian method)
  let backPos = pos - v * uDeltaTime * uGridSize.w;

  // Bilinear Interpolation
  velocityOut[index] = sampleVelocity(backPos);
}
