// Divergence compute shader
/* This shader computes the divergence of the velocity field over a 2D grid.
Divergence is a measure of the net outflow of velocity from a given cell.

For each cell in the grid:
    1. Computes the 1D index from the 2D grid coordinates
    2. Determine the indices of neighboring cells (left, right, top, and bottom)
       using clamping to ensure that boundary cells don’t access out-of-bounds memory
    3. Approximate the spatial derivatives using finite differences:
         - The x-derivative (dVx) is computed as the difference between the
           velocity's x-component in the right and left neighbors.
         - The y-derivative (dVy) is computed as the difference between the
           velocity's y-component in the bottom and top neighbors.
    4. The divergence at that cell is then set to half the sum of these differences.

  A divergence value near zero indicates that the cell is approximately incompressible.
*/

@group(0) @binding(0) var<storage, read> velocity: array<vec2<f32>>;
@group(0) @binding(1) var<storage, read_write> divergence: array<f32>;
@group(0) @binding(2) var<uniform> uGridSize: vec4<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let x: u32 = global_id.x;
  let y: u32 = global_id.y;

  let gridWidth:  u32 = u32(uGridSize.x);
  let gridHeight: u32 = u32(uGridSize.y);
  
  // Bounds check
  if (x >= gridWidth || y >= gridHeight) {
    return;
  }
  
  let index: u32 = x + y * gridWidth;
  
  // Use select() to compute clamped neighbor indices.
  let left:   u32 = select(x, x - 1u, x > 0u);
  let right:  u32 = select(x, x + 1u, x < gridWidth - 1u);
  let top:    u32 = select(y, y - 1u, y > 0u);
  let bottom: u32 = select(y, y + 1u, y < gridHeight - 1u);
  
  let idxLeft:   u32  = left + y * gridWidth;
  let idxRight:  u32  = right + y * gridWidth;
  let idxTop:    u32  = x + top * gridWidth;
  let idxBottom: u32  = x + bottom * gridWidth;
  
  // Finite difference approximations for spatial derivatives.
  let dVx: f32 = velocity[idxRight].x - velocity[idxLeft].x;
  let dVy: f32 = velocity[idxBottom].y - velocity[idxTop].y;
  
  divergence[index] = (dVx + dVy) * 0.5 * uGridSize.w;
}
