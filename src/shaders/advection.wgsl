// Advection Compute Shader
// Reads the velocity field and the current dye field,
// and writes the updated dye field to an output buffer.

@group(0) @binding(0) var<storage, read> velocityField: array<vec2<f32>>;
// read-only current dye field (e.g. a float per cell, representing density)
@group(0) @binding(1) var<storage, read> dyeField: array<f32>;
// for ping-pong update
@group(0) @binding(2) var<storage, read_write> dyeFieldOut: array<f32>;
@group(0) @binding(3) var<uniform> uGridSize: vec2<f32>;
@group(0) @binding(4) var<uniform> uDeltaTime: f32; // TODO: currently not initialized so no effect

// Bilinear interpolation
fn sampleDye(pos: vec2<f32>) -> f32 {
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
  let v0 = dyeField[u32(i0)];
  let v1 = dyeField[u32(i1)];
  let v2 = dyeField[u32(i2)];
  let v3 = dyeField[u32(i3)];

  // Bilinear interpolation
  let interpX0 = mix(v0, v1, fx);
  let interpX1 = mix(v2, v3, fx);
  return mix(interpX0, interpX1, fy);

  // let i0 = u32(x0 + y0 * uGridSize.x);
  // let i1 = u32(x1 + y0 * uGridSize.x);
  // let i2 = u32(x0 + y1 * uGridSize.x);
  // let i3 = u32(x1 + y1 * uGridSize.x);

  // let v0 = dyeField[i0];
  // let v1 = dyeField[i1];
  // let v2 = dyeField[i2];
  // let v3 = dyeField[i3];

  // let interpX0 = mix(v0, v1, fx);
  // let interpX1 = mix(v2, v3, fx);
  // return mix(interpX0, interpX1, fy);
}

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
  
  // Get cell velocity
  let v = velocityField[index];
  
  // Semi-Lagrangian backtrace
  // Calculate the position where the fluid at this cell came from
  // Euler backtracing  -- TODO: explore other time integration methods? Runge Kutta?
  let backPos = pos - v * uDeltaTime;
  
  // Clamp the backtraced position to be within the grid bounds
  let clampedPos = clamp(backPos, vec2<f32>(0.0), uGridSize - vec2<f32>(1.0));

  dyeFieldOut[index] = sampleDye(clampedPos);
}
