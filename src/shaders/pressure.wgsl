// pressure compute shader
@group(0) @binding(0) var<storage, read> divergence: array<f32>;
@group(0) @binding(1) var<storage, read> pressure: array<f32>;
@group(0) @binding(2) var<uniform> uGridSize: vec4<f32>;
@group(0) @binding(3) var<storage, read_write> pressureOut: array<f32>;

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
  
  // Gather neighboring pressure values with clamping
  let pressureLeft:   f32 = select(pressure[index], pressure[index - 1u], (x > 0u));
  let pressureRight:  f32 = select(pressure[index], pressure[index + 1u], (x < gridWidth - 1u));
  let pressureTop:    f32 = select(pressure[index], pressure[index - gridWidth], (y > 0u));
  let pressureBottom: f32 = select(pressure[index], pressure[index + gridWidth], (y < gridHeight - 1u));
  
  // Average the neighboring pressures and add the local divergence.
  // In a typical Jacobi iteration for the Poisson equation,
  // pressure_new = (divergence + (pressure_left + pressure_right + pressure_top + pressure_bottom)) / 4.0
  let alpha: f32 = -(uGridSize.z * uGridSize.z); //0.3; // relaxation factor
  let recipBeta = 0.25; // divide by 4
  var newPressure = (alpha * divergence[index] + pressureLeft + pressureRight + pressureTop + pressureBottom) * recipBeta;
//                   (1.0 - alpha) * pressure[index];

  pressureOut[index] = newPressure;
}
