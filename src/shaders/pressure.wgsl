// Pressure Solve compute shader
/* This shader performs one Jacobi iteration to solve the pressure Poisson equation,
   which is used to enforce incompressibility in the fluid by removing divergence.

   For each non-boundary grid cell:
     1. Samples the pressure values from the four neighboring cells (left, right, top, bottom),
        using clamping to handle boundary conditions.
     2. Combines the neighbor pressures with the local divergence value.
     3. Applies the Jacobi update formula:
        `newPressure = (alpha * divergence + sum of neighbors) * 0.25`
     4. Writes the updated pressure to the output buffer (`pressureOut`).

   This iterative process gradually builds a pressure field that compensates for
   divergence in the velocity field, ensuring volume preservation.
*/

@group(0) @binding(0) var<storage, read> divergence: array<f32>;
@group(0) @binding(1) var<storage, read> pressureIn: array<f32>;
@group(0) @binding(2) var<uniform> uGridSize: vec4<f32>;
@group(0) @binding(3) var<storage, read_write> pressureOut: array<f32>;

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
  
  // Gather neighboring pressure values with clamping
  let pressureLeft:   f32 = select(pressureIn[index], pressureIn[index - 1u], (x > 0u));
  let pressureRight:  f32 = select(pressureIn[index], pressureIn[index + 1u], (x < gridWidth - 1u));
  let pressureTop:    f32 = select(pressureIn[index], pressureIn[index - gridWidth], (y > 0u));
  let pressureBottom: f32 = select(pressureIn[index], pressureIn[index + gridWidth], (y < gridHeight - 1u));
  
  // Average the neighboring pressures and add the local divergence.
  // In a typical Jacobi iteration for the Poisson equation,
  let alpha: f32 = -(uGridSize.z * uGridSize.z); // relaxation factor
  let recipBeta = 0.25; // divide by 4
  var newPressure = (alpha * divergence[index] + pressureLeft + pressureRight + pressureTop + pressureBottom) * recipBeta;

  pressureOut[index] = newPressure;
}
