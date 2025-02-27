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

// @fragment
// fn fs_main() -> @location(0) vec4<f32> {
//   return vec4<f32>(0.0, 0.0, 1.0, 1.0); // blue screen
// }

@group(0) @binding(0) var<storage, read> velocityBuffer: array<vec2<f32>>;
// To map between canvas coordinates and simulation grid
@group(0) @binding(1) var<uniform> gridSize: vec2<f32>;
@group(0) @binding(2) var<uniform> canvasSize: vec2<f32>;
@group(0) @binding(3) var<storage, read> dyeFiledBuffer: array<f32>;

@fragment
fn fs_main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
  // Normalize by canvas size (0 - 1)
  let uv = fragCoord.xy / canvasSize;
  // Map the normalized coordinates to grid coordinates
  let gridPos = uv * gridSize;

  // Compute index into the velocity array
  // assumes row-major order
  let gridX = u32(gridPos.x);
  let gridY = u32(gridPos.y);
  let index = gridX + gridY * u32(gridSize.x);

  let vel = velocityBuffer[index];
  let speed = length(vel);

  // Visualise speed with a color gradient
  // E.g. when speed is 1 (fast), R=1 and B=0 so the output is red
  // Else, when speed is 0, R=0 and B=1 output is blue
  // return vec4<f32>(speed, 0.0, 1.0 - speed, 1.0);

  let density = dyeFiledBuffer[index];
  return vec4<f32>(density, density, density, 1.0);

  // TODO: Revisit formula/velocity injection
  // When going over the same region, the region sometimes changes back from red to blue
  // I think this could be because when the mouse direction changes the velocity may be nearly opposite to the existing velocity.
  // Consider interpolation of old vel value and new? consider inertia?
}
