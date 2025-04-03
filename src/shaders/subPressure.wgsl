// Subtract Pressure Compute Shader
@group(0) @binding(0) var<storage, read_write> velocity: array<vec2<f32>>;
@group(0) @binding(1) var<storage, read> pressure: array<f32>;
@group(0) @binding(2) var<uniform> uGridSize: vec4<f32>;;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let x: u32 = global_id.x;
  let y: u32 = global_id.y;

  let gridWidth:  u32 = u32(uGridSize.x);
  let gridHeight: u32 = u32(uGridSize.y);
  
  if (x >= gridWidth || y >= gridHeight) {
    return;
  }
  
  let index: u32 = x + y * gridWidth;
  
  // Use clamped indices to get pressure differences
  let pressureLeft:   f32 = select(pressure[index], pressure[index - 1u], (x > 0u));
  let pressureRight:  f32 = select(pressure[index], pressure[index + 1u], (x < gridWidth - 1u));
  let pressureTop:    f32 = select(pressure[index], pressure[index - gridWidth], (y > 0u));
  let pressureBottom: f32 = select(pressure[index], pressure[index + gridWidth], (y < gridHeight - 1u));

  // Compute the gradient via finite differences.
  let grad: vec2<f32> = vec2<f32>(
    (pressureRight - pressureLeft) * 0.5 * uGridSize.w,
    (pressureBottom - pressureTop) * 0.5 * uGridSize.w
  );
  
  // Subtract the gradient from the velocity field.
  velocity[index] -=  grad;
}
