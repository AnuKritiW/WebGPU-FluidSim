/*
Enforces Neumann pressure boundary conditions (zero-gradient) by copying the pressure value from the nearest interior cell to each boundary cell. 
This prevents artificial pressure build-up at the domain edges and maintains stable simulation behavior.
*/

@group(0) @binding(0) var<storage, read> pressureIn: array<f32>;
@group(0) @binding(1) var<storage, read_write> pressureOut: array<f32>;
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

  var sampleX = x;
  var sampleY = y;

  if (x == 0) {
    sampleX = 1;
  } else if (x == gridWidth - 1) {
    sampleX = gridWidth - 2;
  }

  if (y == 0) {
    sampleY = 1;
  } else if (y == gridHeight - 1) {
    sampleY = gridHeight - 2;
  }

  let sampleIndex = sampleX + sampleY * gridWidth;

  // Copy the pressure value from the nearest interior cell
  pressureOut[index] = pressureIn[sampleIndex];
}
