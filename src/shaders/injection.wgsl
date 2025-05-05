// injection.wgsl
@group(0) @binding(0) var<storage, read> dye: array<vec3<f32>>;
@group(0) @binding(1) var<uniform> uMouse : vec4<f32>; // (posX, posY, velX, velY)
@group(0) @binding(2) var<uniform> injectionAmount: f32;
@group(0) @binding(3) var<uniform> uGridSize: vec4<f32>; // (gridWidth, gridHeight, dx, rdx)
@group(0) @binding(4) var<uniform> uDeltaTime : f32;
@group(0) @binding(5) var<uniform> uDiffusion : f32;
@group(0) @binding(6) var<storage, read_write> dyeOut: array<vec3<f32>>;
@group(0) @binding(7) var<uniform> uStrength : f32;

fn hsv2rgb(hsv: vec3<f32>) -> vec3<f32> {
    let h = hsv.x;
    let s = hsv.y;
    let v = hsv.z;
    let c = v * s;
    let x = c * (1.0 - abs(fract(h * 6.0) * 2.0 - 1.0));
    let m = v - c;

    var rgb: vec3<f32>;

    if (h < 1.0/6.0) {
        rgb = vec3<f32>(c, x, 0.0);
    } else if (h < 2.0/6.0) {
        rgb = vec3<f32>(x, c, 0.0);
    } else if (h < 3.0/6.0) {
        rgb = vec3<f32>(0.0, c, x);
    } else if (h < 4.0/6.0) {
        rgb = vec3<f32>(0.0, x, c);
    } else if (h < 5.0/6.0) {
        rgb = vec3<f32>(x, 0.0, c);
    } else {
        rgb = vec3<f32>(c, 0.0, x);
    }

    return rgb + vec3<f32>(m);
}

// Gaussian function for splatting dye influence
fn gaussianWeight(pos: vec2<f32>, center: vec2<f32>, vel: vec2<f32>, rad: f32) -> f32 {
  var diff = pos - center;
  // divide by radius if you want a sharper falloff (as opposed to radius^2)
  let distSq = dot(diff, diff);
  // optimize by pre-computing the inverse of radius squared
  let invRad = 1.0 / rad;
  return exp(-distSq * invRad) * length(vel);
}

@compute @workgroup_size(8,8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {

  if (uMouse.z == 0.0 && uMouse.w == 0.0) {
    return;
  }

  // Bounds check
  let x = global_id.x;
  let y = global_id.y;
  if (x == 0 || y == 0 || x >= (u32(uGridSize.x)) || y >= (u32(uGridSize.y))) {
    return;
  }

  // Compute the 1D index for buffers
  let index = x + y * u32(uGridSize.x);

  // get grid cell position from the workgroup index
  let pos = vec2<f32>(f32(x), f32(y));// / uGridSize.xy;
  // let safeMax = vec2<f32>(uGridSize.x - 1.0, uGridSize.y - 1.0) - vec2<f32>(1.0);
  // let mousePos = clamp(uMouse.xy * uGridSize.xy, vec2<f32>(0.0), safeMax);

  // Distance from cell to the injection position
  let mousePos = uMouse.xy * uGridSize.xy;
  let mouseVel = uMouse.zw * uStrength * uGridSize.xy;

  // Define injection radius in grid units – within which injection occurs.
  let radius = 2.0;

  // Gaussian weight for smoother injection
  let weight = gaussianWeight(pos, mousePos, mouseVel, radius);

  // Color logic — direction or time based hue
  let angle = atan2(mouseVel.y, mouseVel.x); // range (-π, π)
  let hue = fract(angle / (2.0 * 3.14159265)); // normalize to [0,1]
  let rgbColor = hsv2rgb(vec3<f32>(hue, 1.0, 1.0));

  // Inject and blend dye
  let current = dye[index];
  let injected = rgbColor * injectionAmount * weight * uDeltaTime * 500.0;
  dyeOut[index] = clamp(injected + current * uDiffusion, vec3<f32>(0.0), vec3<f32>(10.0));
}