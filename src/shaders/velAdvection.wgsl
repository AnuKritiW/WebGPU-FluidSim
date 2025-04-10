// This shader advects the velocity field itself using a semi-Lagrangian method.
// Reads the current velocity field (velIn) and writes the advected field into velOut.
@group(0) @binding(0) var<storage, read> velIn: array<vec2<f32>>;
@group(0) @binding(1) var<storage, read_write> velOut: array<vec2<f32>>;
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

  let v0 = velIn[i0];
  let v1 = velIn[i1];
  let v2 = velIn[i2];
  let v3 = velIn[i3];

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
  
  let v = velIn[index];
  
  // Compute the backtraced position (semi-Lagrangian method)
  let backPos = pos - v * uDeltaTime;

  // Bilinear Interpolation
  let advectedVelocity =sampleVelocity(backPos);

  let epsilon: f32 = 1e-4;
  if (length(advectedVelocity) < epsilon) {
    velOut[index] = vec2<f32>(0.0);
  } else {
    velOut[index] = advectedVelocity;
  }
}
