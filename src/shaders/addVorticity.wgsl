@group(0) @binding(0) var<storage, read> velocity: array<vec2<f32>>;
@group(0) @binding(1) var<storage, read> vorticity: array<f32>;
@group(0) @binding(2) var<uniform> uGridSize: vec4<f32>;
@group(0) @binding(3) var<uniform> uVorticityStrength: f32;
@group(0) @binding(4) var<uniform> uDeltaTime: f32;
@group(0) @binding(5) var<storage, read_write> velOut: array<vec2<f32>>;

@compute @workgroup_size(8,8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  // Bounds check
  let x = global_id.x;
  let y = global_id.y;
  let gridWidth: u32 = u32(uGridSize.x);
  let gridHeight: u32 = u32(uGridSize.y);
  if (x == 0 || y == 0 || x >= gridWidth || y >= gridHeight) {
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
  velOut[index] = velocity[index] + N;
}
