// Subtract Pressure Gradient compute shader
/* This shader enforces incompressibility by subtracting the pressure gradient
   from the velocity field, ensuring that the updated velocity field is divergence-free.

   For each non-boundary grid cell:
     1. Samples neighboring pressure values (left, right, top, bottom) with clamping.
     2. Computes the pressure gradient using central finite differences.
     3. Scales the gradient by `0.5 * rdx` (from `uGridSize.w`) to match spatial resolution.
     4. Subtracts the pressure gradient from the velocity at the current cell.

   This step removes divergence introduced during advection or force injection,
   making the velocity field compliant with the incompressibility condition.
*/

@group(0) @binding(0) var<storage, read_write> velocity: array<vec2<f32>>;
@group(0) @binding(1) var<storage, read> pressure: array<f32>;
@group(0) @binding(2) var<uniform> uGridSize: vec4<f32>;;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let x: u32 = global_id.x;
  let y: u32 = global_id.y;

  let gridWidth:  u32 = u32(uGridSize.x);
  let gridHeight: u32 = u32(uGridSize.y);
  
  if (x == 0 || y == 0 || x >= (u32(uGridSize.x)) || y >= (u32(uGridSize.y))) {
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
