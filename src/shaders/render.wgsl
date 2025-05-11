@vertex
// defines full screen quad positions
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  let pos = array(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>( 1.0,  1.0),
  );
  return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
}

// To map between canvas coordinates and simulation grid
@group(0) @binding(0) var<uniform> uGridSize: vec2<f32>;
@group(0) @binding(1) var<uniform> canvasSize: vec2<f32>;
@group(0) @binding(2) var<storage, read> dye: array<vec3<f32>>;

// Bilinear interpolation

fn sampleDye(pos: vec2<f32>) -> vec3<f32> {
  let x0 = floor(pos.x);
  let y0 = floor(pos.y);
  let x1 = x0 + 1.0;
  let y1 = y0 + 1.0;

  let fx = pos.x - x0;
  let fy = pos.y - y0;

  let i0 = u32(x0 + y0 * uGridSize.x);
  let i1 = u32(x1 + y0 * uGridSize.x);
  let i2 = u32(x0 + y1 * uGridSize.x);
  let i3 = u32(x1 + y1 * uGridSize.x);

  let v0 = dye[i0];
  let v1 = dye[i1];
  let v2 = dye[i2];
  let v3 = dye[i3];

  let interpX0 = mix(v0, v1, fx);
  let interpX1 = mix(v2, v3, fx);
  return mix(interpX0, interpX1, fy);
}

@fragment
fn fs_main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
  // Normalize by canvas size (0 - 1)
  let uv = fragCoord.xy / canvasSize;

  // Map the normalized coordinates to grid coordinates
  let gridPos = clamp(uv * uGridSize, vec2<f32>(0.0), uGridSize - vec2<f32>(2.0));

  let dyeVal = sampleDye(gridPos);

  let brightness = pow(dyeVal, vec3<f32>(0.5));          // soft contrast
  let alpha = clamp(length(dyeVal) * 2.0, 0.0, 1.0);  // opacity ramp

  return vec4<f32>(brightness, alpha);
}
