// Enforce Velocity Boundary compute shader
/* This shader enforces no-slip boundary conditions on the velocity field by reflecting
   velocity components at the edges of the simulation domain to simulate solid wall bounce-back.

   For each boundary grid cell:
     1. Samples velocity from the nearest interior cell.
     2. Flips the velocity component normal to the boundary (x or y) to simulate reversal.
     3. Writes the reflected velocity to the output buffer (`velocityOut`).

   This creates the effect of fluid sticking to and bouncing off the domain walls,
   consistent with solid boundary behavior in real-world fluid dynamics.
*/


@group(0) @binding(0) var<storage, read> velocityIn: array<vec2<f32>>;
@group(0) @binding(1) var<storage, read_write> velocityOut: array<vec2<f32>>;
@group(0) @binding(2) var<uniform> uGridSize: vec2<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let x = global_id.x;
  let y = global_id.y;
  let gridWidth: u32 = u32(uGridSize.x);
  let gridHeight: u32 = u32(uGridSize.y);

  if (x == 0 || y == 0 || x >= (u32(uGridSize.x)) || y >= (u32(uGridSize.y))) {
    return;
  }
  
  let index = x + y * gridWidth;

  // Assume it's an interior cell
  var sampleX = x;
  var sampleY = y;
  var flipX = 1.0;
  var flipY = 1.0;

  // Sample neighbor if on a wall and flip the reflected component
  if (x == 0) {
    sampleX = 1;
    flipX = -1.0; // bounce back
  } else if (x == gridWidth - 1) {
    sampleX = gridWidth - 2;
    flipX = -1.0;
  }

  if (y == 0) {
    sampleY = 1;
    flipY = -1.0;
  } else if (y == gridHeight - 1) {
    sampleY = gridHeight - 2;
    flipY = -1.0;
  }

  let neighborIndex = sampleX + sampleY * gridWidth;
  let vel = velocityIn[neighborIndex];

  // Reflect the velocity components
  velocityOut[index] = vec2<f32>(vel.x * flipX, vel.y * flipY);
}
