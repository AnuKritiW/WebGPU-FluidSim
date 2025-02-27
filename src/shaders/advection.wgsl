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
  
  // nearest neighbor sampling
  // TODO: bilenear interpolation instead
  let sampleX = u32(clampedPos.x);
  let sampleY = u32(clampedPos.y);
  let sampleIndex = sampleX + sampleY * u32(uGridSize.x);
  
  // Write the advected dye value into the output buffer
  dyeFieldOut[index] = dyeField[sampleIndex];
}
