@group(0) @binding(0) var<storage, read_write> velocity: array<vec2<f32>>;
@group(0) @binding(1) var<storage, read> vorticity: array<f32>;
@group(0) @binding(2) var<uniform> uGridSize: vec4<f32>;
@group(0) @binding(3) var<uniform> uVorticityStrength: f32;
@group(0) @binding(4) var<uniform> uDeltaTime: f32;

@compute @workgroup_size(8,8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  // Bounds check
  let x = global_id.x;
  let y = global_id.y;
  let gridWidth: u32 = u32(uGridSize.x);
  let gridHeight: u32 = u32(uGridSize.y);
  if (x >= gridWidth || y >= gridHeight) {
    return;
  }

  // Compute the 1D index for buffers
  let index = x + y * gridWidth;

  // Compute ∇|ω| (gradient of absolute vorticity)
  let left    = select(vorticity[index], vorticity[index - 1u], x > 0u);
  let right   = select(vorticity[index], vorticity[index + 1u], x < gridWidth - 1u);
  let bottom  = select(vorticity[index], vorticity[index + gridWidth], y < gridHeight - 1u);
  let top     = select(vorticity[index], vorticity[index - gridWidth], y > 0u);

  let grad = 0.5 * uGridSize.w * vec2<f32>(
    abs(right) - abs(left),
    abs(top) - abs(bottom)
  );

  // Normalize gradient
  let epsilon = 1e-5;
  let gradMag = max(epsilon, length(grad));
  let N = grad / gradMag;

  // compute confinement force
  let curl = vorticity[index];
  let force = vec2<f32>(N.y, -N.x) * curl * uVorticityStrength * uGridSize.z * uDeltaTime;

  // Add the force to the velocity field
  velocity[index] += force;
}
