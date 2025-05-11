// Vorticity Confinement compute shader
/* This shader applies vorticity confinement, which reinforces swirling motions
  in the velocity field to preserve small-scale vortices and improve visual realism.

  For each non-boundary cell in the 2D velocity grid:
    1. Computes the 1D index from the 2D global invocation ID.
    2. Retrieves the vorticity values of neighboring cells (left, right, top, bottom),
       using clamping to avoid out-of-bounds access.
    3. Computes the gradient of the magnitude of vorticity (∇|ω|), using finite differences.
    4. Normalizes this gradient to obtain the unit vector N, pointing toward higher vorticity magnitude.
    5. Computes the confinement force: a force perpendicular to N scaled by the
       local vorticity value, a tunable strength factor, and the simulation timestep.
    6. Applies this confinement force to the velocity field and stores the result in `velocityOut`.

  This step enhances swirling features and prevents their dissipation due to numerical diffusion.
*/

@group(0) @binding(0) var<storage, read> velocityIn: array<vec2<f32>>;
@group(0) @binding(1) var<storage, read> vorticity: array<f32>;
@group(0) @binding(2) var<uniform> uGridSize: vec4<f32>;
@group(0) @binding(3) var<uniform> uVorticityStrength: f32;
@group(0) @binding(4) var<uniform> uDeltaTime: f32;
@group(0) @binding(5) var<storage, read_write> velocityOut: array<vec2<f32>>;

@compute @workgroup_size(8,8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  // Bounds check
  let x = global_id.x;
  let y = global_id.y;
  let gridWidth: u32 = u32(uGridSize.x);
  let gridHeight: u32 = u32(uGridSize.y);
  if (x == 0 || y == 0 || x >= (u32(uGridSize.x)) || y >= (u32(uGridSize.y))) {
    return;
  }

  // Compute the 1D index for buffers
  let index = x + y * gridWidth;

  // // Compute ∇|ω| (gradient of absolute vorticity)
  let leftIdx   = select(index, index - 1u, x > 0u);
  let rightIdx  = select(index, index + 1u, x < gridWidth - 1u);
  let topIdx    = select(index, index - gridWidth, y > 0u);
  let bottomIdx = select(index, index + gridWidth, y < gridHeight - 1u);

  let grad = 0.5 * uGridSize.w * vec2<f32>(
    abs(vorticity[topIdx]) - abs(vorticity[bottomIdx]),
    abs(vorticity[rightIdx]) - abs(vorticity[leftIdx])
  );

  // Normalize gradient
  let epsilon = 1e-5;
  let gradMag = max(epsilon, sqrt(dot(grad, grad)));
  var N = grad / gradMag;

  // compute confinement force
  let curl = vorticity[index];
  N *= uGridSize.z * uVorticityStrength * uDeltaTime * curl * vec2(1.0, -1.0);

  // Add the force to the velocity field
  velocityOut[index] = velocityIn[index] + N;
}
