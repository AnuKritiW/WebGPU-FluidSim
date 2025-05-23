// Dye Advection compute shader
/* This shader performs semi-Lagrangian advection of a dye field over a 2D grid.
   Advection transports dye based on the local velocity field by tracing each grid cell backward in time to sample its previous state.

   For each non-boundary grid cell:
     1. Retrieves the velocity at the current cell using bilinear interpolation over the velocity field.
     2. Computes the backtraced position from which the fluid at this cell
        originated using Euler integration (`pos - velocity * dt * rdx`).
     3. Clamps this position to remain within the grid domain.
     4. Uses bilinear interpolation to sample the dye field at the backtraced position.
     5. Writes the resulting dye value into the output buffer (`dyeOut`), enabling ping-pong updates between frames.
*/

@group(0) @binding(0) var<storage, read> velocity: array<vec2<f32>>;
// read-only current dye field (e.g. a float per cell, representing density)
@group(0) @binding(1) var<storage, read> dyeIn: array<vec3<f32>>;
// for ping-pong update
@group(0) @binding(2) var<storage, read_write> dyeOut: array<vec3<f32>>;
@group(0) @binding(3) var<uniform> uGridSize: vec4<f32>; // (gridWidth, gridHeight, dx, rdx)
@group(0) @binding(4) var<uniform> uDeltaTime: f32;

// Bilinear interpolation
fn sampleDye(pos: vec2<f32>) -> vec3<f32> {
  let x0f = floor(pos.x);
  let y0f = floor(pos.y);
  let x1f = x0f + 1.0;
  let y1f = y0f + 1.0;

  let fx = pos.x - x0f;
  let fy = pos.y - y0f;

  let maxX = i32(uGridSize.x) - 1;
  let maxY = i32(uGridSize.y) - 1;

  let x0 = clamp(i32(x0f), 0, maxX);
  let x1 = clamp(i32(x1f), 0, maxX);
  let y0 = clamp(i32(y0f), 0, maxY);
  let y1 = clamp(i32(y1f), 0, maxY);

  // Convert 2D -> 1D indices
  let i0 = x0 + y0 * i32(uGridSize.x);
  let i1 = x1 + y0 * i32(uGridSize.x);
  let i2 = x0 + y1 * i32(uGridSize.x);
  let i3 = x1 + y1 * i32(uGridSize.x);

  // Fetch the four corners
  let v0 = dyeIn[u32(i0)];
  let v1 = dyeIn[u32(i1)];
  let v2 = dyeIn[u32(i2)];
  let v3 = dyeIn[u32(i3)];

  // Bilinear interpolation
  let interpX0 = mix(v0, v1, fx);
  let interpX1 = mix(v2, v3, fx);
  return mix(interpX0, interpX1, fy);
}

// TODO: abstract out common code with above
fn sampleVelocity(pos: vec2<f32>) -> vec2<f32> {
  // Clamp position to avoid sampling out-of-bounds
  let x0f = floor(pos.x);
  let y0f = floor(pos.y);

  // Interpolation weights
  let fx = pos.x - x0f;
  let fy = pos.y - y0f;

  // Convert to safe clamped integer grid indices
  let x0 = i32(x0f);
  let y0 = i32(y0f);
  let x1 = x0 + 1;
  let y1 = y0 + 1;

  // 2D → 1D buffer indices
  let i0 = u32(x0 + y0 * i32(uGridSize.x));
  let i1 = u32(x1 + y0 * i32(uGridSize.x));
  let i2 = u32(x0 + y1 * i32(uGridSize.x));
  let i3 = u32(x1 + y1 * i32(uGridSize.x));

  // Fetch four corner velocities
  let v0 = velocity[i0];
  let v1 = velocity[i1];
  let v2 = velocity[i2];
  let v3 = velocity[i3];

  // Bilinear interpolation
  let interpX0 = mix(v0, v1, fx);
  let interpX1 = mix(v2, v3, fx);
  return mix(interpX0, interpX1, fy);
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  // Bounds check
  let x = global_id.x;
  let y = global_id.y;
  if (x == 0 || y == 0 || x >= u32(uGridSize.x) || y >= u32(uGridSize.y)) {
    return;
  }

  // Compute the 1D index for buffers
  let index = x + y * u32(uGridSize.x);

  // get grid cell position from the workgroup index
  let pos = vec2<f32>(f32(x), f32(y));
  
  // Get cell velocity
  let v = sampleVelocity(pos);

  let displacement = v * (uDeltaTime * uGridSize.w);
  
  // Semi-Lagrangian backtrace
  // Calculate the position where the fluid at this cell came from
  // Euler backtracing  -- TODO: explore other time integration methods? Runge Kutta?
  let backPos = pos - displacement; //v * uDeltaTime;
  
  // Clamp the backtraced position to be within the grid bounds
  let clampedPos = clamp(backPos, vec2<f32>(0.0), uGridSize.xy - vec2<f32>(1.0));

  dyeOut[index] = sampleDye(clampedPos);
}
