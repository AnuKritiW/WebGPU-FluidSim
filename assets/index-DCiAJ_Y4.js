var Y=Object.defineProperty;var A=(e,n,r)=>n in e?Y(e,n,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[n]=r;var C=(e,n,r)=>A(e,typeof n!="symbol"?n+"":n,r);(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))a(t);new MutationObserver(t=>{for(const u of t)if(u.type==="childList")for(const d of u.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&a(d)}).observe(document,{childList:!0,subtree:!0});function r(t){const u={};return t.integrity&&(u.integrity=t.integrity),t.referrerPolicy&&(u.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?u.credentials="include":t.crossOrigin==="anonymous"?u.credentials="omit":u.credentials="same-origin",u}function a(t){if(t.ep)return;t.ep=!0;const u=r(t);fetch(t.href,u)}})();async function W(e){const n=document.getElementById("gpu-status");if(!navigator.gpu)throw console.error("WebGPU not supported on this browser."),n&&(n.innerText="WebGPU not supported!"),new Error("WebGPU not supported.");const r=await navigator.gpu.requestAdapter();if(!r)throw console.error("No appropriate GPUAdapter found."),n&&(n.innerText="No compatible GPU found!"),new Error("No appropriate GPUAdapter found.");const a=await r.requestDevice();if(!a)throw console.error("Failed to get WebGPU device."),n&&(n.innerText="Failed to initialize WebGPU!"),new Error("Failed to get WebGPU device.");console.log("WebGPU initialized successfully!"),n&&(n.innerText="WebGPU is working!");const t=e.getContext("webgpu"),u=navigator.gpu.getPreferredCanvasFormat();return t.configure({device:a,format:u}),{device:a,context:t,format:u}}const I=`@vertex
// defines full screen quad positions
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  let pos = array(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>( 1.0,  1.0),
  );
  return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
}

// To map between canvas coordinates and simulation grid
@group(0) @binding(0) var<uniform> gridSize: vec2<f32>;
@group(0) @binding(1) var<uniform> canvasSize: vec2<f32>;
@group(0) @binding(2) var<storage, read> dyeFiledBuffer: array<vec3<f32>>;

// Bilinear interpolation

fn sampleDye(pos: vec2<f32>) -> vec3<f32> {
  let x0 = floor(pos.x);
  let y0 = floor(pos.y);
  // let x0 = clamp(floor(pos.x), 0.0, gridSize.x - 2.0);
  // let y0 = clamp(floor(pos.y), 0.0, gridSize.y - 2.0);
  let x1 = x0 + 1.0;
  let y1 = y0 + 1.0;

  let fx = pos.x - x0;
  let fy = pos.y - y0;

  let i0 = u32(x0 + y0 * gridSize.x);
  let i1 = u32(x1 + y0 * gridSize.x);
  let i2 = u32(x0 + y1 * gridSize.x);
  let i3 = u32(x1 + y1 * gridSize.x);

  let v0 = dyeFiledBuffer[i0];
  let v1 = dyeFiledBuffer[i1];
  let v2 = dyeFiledBuffer[i2];
  let v3 = dyeFiledBuffer[i3];

  let interpX0 = mix(v0, v1, fx);
  let interpX1 = mix(v2, v3, fx);
  return mix(interpX0, interpX1, fy);
}

@fragment
fn fs_main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
  // Normalize by canvas size (0 - 1)
  let uv = fragCoord.xy / canvasSize;

  // Map the normalized coordinates to grid coordinates
  let gridPos = clamp(uv * gridSize, vec2<f32>(0.0), gridSize - vec2<f32>(2.0));

  let dyeVal = sampleDye(gridPos);

  let brightness = pow(dyeVal, vec3<f32>(0.5));          // soft contrast
  let alpha = clamp(length(dyeVal) * 2.0, 0.0, 1.0);  // opacity ramp

  return vec4<f32>(brightness, alpha);
}
`,L=`/*
This shader injects forces into the velocity field using a 
Gaussian splatting approach that is anisotropically stretched 
in the direction of the mouse movement.
*/

// Stores vel values for each cell -- read and write access
@group(0) @binding(0) var<storage, read> vel : array<vec2<f32>>;

// Stores mouse position (xy) and velocity (zw)
@group(0) @binding(1) var<uniform> uMouse : vec4<f32>; // (posX, posY, velX, velY)

// Stores grid dimensions
@group(0) @binding(2) var<uniform> uGridSize : vec2<f32>;

// Stores the radius within which the force can spread
@group(0) @binding(3) var<uniform> uRad : f32;

// Stores the strength of the applied force
@group(0) @binding(4) var<uniform> uStrength : f32;

// Stores deltaTime (time between frames)
@group(0) @binding(5) var<uniform> uDeltaTime : f32;

@group(0) @binding(6) var<storage, read_write> velOut : array<vec2<f32>>;
@group(0) @binding(7) var<uniform> uDiffusion : f32;

// Gaussian function for splatting velocity influence
fn gaussianWeight(pos: vec2<f32>, center: vec2<f32>, vel: vec2<f32>, rad: f32) -> vec2<f32> {
  var diff = pos - center;
  // divide by radius if you want a sharper falloff (as opposed to radius^2)
  let distSq = dot(diff, diff);
  let invRad = 1.0 / rad;
  let sharpness = 1.0;
  return exp(-distSq * invRad * sharpness) * vel;
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {

    // Bounds check
    let x = global_id.x;
    let y = global_id.y;
    if (x == 0 || y == 0 || x >= (u32(uGridSize.x)) || y >= (u32(uGridSize.y))) {
      return;
    }

    // Compute the 1D index for buffers
    let index = x + y * u32(uGridSize.x);

    // get grid cell position from the workgroup index
    // let pos = vec2<f32>(f32(x), f32(y));
    let pos = vec2<f32>(f32(x), f32(y));// / uGridSize.xy;

    // let mousePosGrid = uMouse.xy * uGridSize.xy; // convert mouse position to grid space coordinates
    let mousePos = uMouse.xy * uGridSize.xy;
    let mouseVel = uMouse.zw * uStrength * uGridSize.xy; // amplify mouse velocity by strength for effect

    let influence = gaussianWeight(pos, mousePos, mouseVel, uRad);
    velOut[index] = vel[index] * uDiffusion + influence * uDeltaTime * 100.0; // amplify the effect by 100.0 to move the dye
}
`,k=`// Advection Compute Shader
// Reads the velocity field and the current dye field,
// and writes the updated dye field to an output buffer.

@group(0) @binding(0) var<storage, read> velocityField: array<vec2<f32>>;
// read-only current dye field (e.g. a float per cell, representing density)
@group(0) @binding(1) var<storage, read> dyeField: array<vec3<f32>>;
// for ping-pong update
@group(0) @binding(2) var<storage, read_write> dyeFieldOut: array<vec3<f32>>;
@group(0) @binding(3) var<uniform> uGridSize: vec4<f32>; // (gridWidth, gridHeight, dx, rdx)
@group(0) @binding(4) var<uniform> uDeltaTime: f32;

// Bilinear interpolation
fn sampleDye(pos: vec2<f32>) -> vec3<f32> {
  let x0f = floor(pos.x);
  let y0f = floor(pos.y);
  // let x0f = clamp(floor(pos.x), 0.0, uGridSize.x - 2.0);
  // let y0f = clamp(floor(pos.y), 0.0, uGridSize.y - 2.0);
  let x1f = x0f + 1.0;
  let y1f = y0f + 1.0;

  let fx = pos.x - x0f;
  let fy = pos.y - y0f;

  let maxX = i32(uGridSize.x) - 1;
  let maxY = i32(uGridSize.y) - 1;

  let x0 = clamp(i32(x0f), 0, maxX);
  let x1 = clamp(i32(x1f), 0, maxX);
  let y0 = clamp(i32(y0f), 0, maxY);
  let y1 = clamp(i32(y1f), 0, maxY);

  // Convert 2D -> 1D indices
  let i0 = x0 + y0 * i32(uGridSize.x);
  let i1 = x1 + y0 * i32(uGridSize.x);
  let i2 = x0 + y1 * i32(uGridSize.x);
  let i3 = x1 + y1 * i32(uGridSize.x);

  // Fetch the four corners
  let v0 = dyeField[u32(i0)];
  let v1 = dyeField[u32(i1)];
  let v2 = dyeField[u32(i2)];
  let v3 = dyeField[u32(i3)];

  // Bilinear interpolation
  let interpX0 = mix(v0, v1, fx);
  let interpX1 = mix(v2, v3, fx);
  return mix(interpX0, interpX1, fy);
}

// TODO: abstract out common code with above
fn sampleVelocity(pos: vec2<f32>) -> vec2<f32> {
  // Clamp position to avoid sampling out-of-bounds
  let x0f = floor(pos.x);
  let y0f = floor(pos.y);

  // Interpolation weights
  let fx = pos.x - x0f;
  let fy = pos.y - y0f;

  // Convert to safe clamped integer grid indices
  let x0 = i32(x0f);
  let y0 = i32(y0f);
  let x1 = x0 + 1;
  let y1 = y0 + 1;

  // 2D → 1D buffer indices
  let i0 = u32(x0 + y0 * i32(uGridSize.x));
  let i1 = u32(x1 + y0 * i32(uGridSize.x));
  let i2 = u32(x0 + y1 * i32(uGridSize.x));
  let i3 = u32(x1 + y1 * i32(uGridSize.x));

  // Fetch four corner velocities
  let v0 = velocityField[i0];
  let v1 = velocityField[i1];
  let v2 = velocityField[i2];
  let v3 = velocityField[i3];

  // Bilinear interpolation
  let interpX0 = mix(v0, v1, fx);
  let interpX1 = mix(v2, v3, fx);
  return mix(interpX0, interpX1, fy);
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  // Bounds check
  let x = global_id.x;
  let y = global_id.y;
  if (x == 0 || y == 0 || x >= u32(uGridSize.x) || y >= u32(uGridSize.y)) {
    return;
  }

  // Compute the 1D index for buffers
  let index = x + y * u32(uGridSize.x);

  // get grid cell position from the workgroup index
  let pos = vec2<f32>(f32(x), f32(y));
  
  // Get cell velocity
  // let v = velocityField[index];
  let v = sampleVelocity(pos);

  let displacement = v * (uDeltaTime * uGridSize.w);
  
  // Semi-Lagrangian backtrace
  // Calculate the position where the fluid at this cell came from
  // Euler backtracing  -- TODO: explore other time integration methods? Runge Kutta?
  let backPos = pos - displacement; //v * uDeltaTime;
  
  // Clamp the backtraced position to be within the grid bounds
  let clampedPos = clamp(backPos, vec2<f32>(0.0), uGridSize.xy - vec2<f32>(1.0));

  dyeFieldOut[index] = sampleDye(clampedPos);
}
`,N=`// Decay Compute Shader

@group(0) @binding(0) var<uniform> uGridSize: vec4<f32>;;
@group(0) @binding(1) var<storage, read_write> dye: array<vec3<f32>>;
@group(0) @binding(2) var<uniform> decayRate: f32;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  // Bounds check
  let x = global_id.x;
  let y = global_id.y;
  if (x == 0 || y == 0 || x >= (u32(uGridSize.x)) || y >= (u32(uGridSize.y))) {
    return;
  }

  // Compute the 1D index for buffers
  let index = x + y * u32(uGridSize.x);

  // get grid cell position from the workgroup index
  let pos = vec2<f32>(f32(x), f32(y));

  let decayedDye = dye[index] * decayRate;
  // let threshold = vec3<f32>(0.01);
  // dye[index] = select(decayedDye, vec3<f32>(0.0), decayedDye < threshold);
  // dye[index] = select(decayedDye, 0.0, decayedDye < 0.01);
  dye[index] = decayedDye;
}`,q=`// Velocity Decay Shader

@group(0) @binding(0) var<uniform> uGridSize: vec4<f32>;
@group(0) @binding(1) var<storage, read_write> velocity: array<vec2<f32>>;
@group(0) @binding(2) var<uniform> velDecayRate: f32;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  // get grid cell position from the workgroup index
  let x = global_id.x;
  let y = global_id.y;
  
  // Bounds check
  if (x == 0 || y == 0 || x >= (u32(uGridSize.x)) || y >= (u32(uGridSize.y))) {
    return;
  }
  let pos = vec2<f32>(global_id.xy);

  // Compute the 1D index for buffers
  let index = u32(pos.x + pos.y * uGridSize.x);

  let decayedVel = velocity[index] * velDecayRate;
  velocity[index] = select(decayedVel, vec2<f32>(0.0), length(decayedVel) < 0.0001);
}`,X=`// injection.wgsl
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
}`,j=`// Divergence compute shader
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
  if (x == 0 || y == 0 || x >= (u32(uGridSize.x)) || y >= (u32(uGridSize.y))) {
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
`,H=`// pressure compute shader
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
  
  if (x == 0 || y == 0 || x >= (u32(uGridSize.x)) || y >= (u32(uGridSize.y))) {
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
  let alpha: f32 = -(uGridSize.z * uGridSize.z); // relaxation factor
  let recipBeta = 0.25; // divide by 4
  var newPressure = (alpha * divergence[index] + pressureLeft + pressureRight + pressureTop + pressureBottom) * recipBeta;

  pressureOut[index] = newPressure;
}
`,K=`// Subtract Pressure Compute Shader
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
`,J=`// This shader advects the velocity field itself using a semi-Lagrangian method.
// Reads the current velocity field (velIn) and writes the advected field into velOut.
@group(0) @binding(0) var<storage, read> velIn: array<vec2<f32>>;
@group(0) @binding(1) var<storage, read_write> velOut: array<vec2<f32>>;
@group(0) @binding(2) var<uniform> uGridSize: vec4<f32>;;
@group(0) @binding(3) var<uniform> uDeltaTime: f32;

// Bilinear sampling in velocity advection:
fn sampleVelocity(pos: vec2<f32>) -> vec2<f32> {
  let gridMax = uGridSize.xy - vec2(1.0);

  // Clamp the position to ensure interpolation stays in bounds
  let clampedPos = clamp(pos, vec2(0.0), gridMax);

  let x0 = floor(clampedPos.x);
  let y0 = floor(clampedPos.y);
  let x1 = x0 + 1.0;
  let y1 = y0 + 1.0;

  let fx = clampedPos.x - x0;
  let fy = clampedPos.y - y0;

  let i0 = u32(x0 + y0 * uGridSize.x);
  let i1 = u32(x1 + y0 * uGridSize.x);
  let i2 = u32(x0 + y1 * uGridSize.x);
  let i3 = u32(x1 + y1 * uGridSize.x);

  let v0 = velIn[i0];
  let v1 = velIn[i1];
  let v2 = velIn[i2];
  let v3 = velIn[i3];

  let interpX0 = mix(v0, v1, fx);
  let interpX1 = mix(v2, v3, fx);
  return mix(interpX0, interpX1, fy);
}

@compute @workgroup_size(8,8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {

  // Bounds check
  let x = global_id.x;
  let y = global_id.y;
  if (x == 0 || y == 0 || x >= (u32(uGridSize.x)) || y >= (u32(uGridSize.y))) {
    return;
  }

  // Compute the 1D index for buffers
  let index = x + y * u32(uGridSize.x);

  // get grid cell position from the workgroup index
  let pos = vec2<f32>(f32(x), f32(y));
  
  let v = velIn[index];
  
  // Compute the backtraced position (semi-Lagrangian method)
  // let backPos = pos - v * uDeltaTime;
  let backPos = pos - v * uDeltaTime * uGridSize.w;

  // Bilinear Interpolation
  velOut[index] = sampleVelocity(backPos);
}
`,Q=`@group(0) @binding(0) var<storage, read> velocity: array<vec2<f32>>;
@group(0) @binding(1) var<uniform> uGridSize: vec4<f32>;
@group(0) @binding(2) var<storage, read_write> vorticity: array<f32>;

@compute @workgroup_size(8,8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let gridWidth = u32(uGridSize.x);
  let gridHeight: u32 = u32(uGridSize.y);

  let x: u32 = global_id.x;
  let y: u32 = global_id.y;

  // Bounds check
  if (x == 0 || y == 0 || x >= (u32(uGridSize.x)) || y >= (u32(uGridSize.y))) {
    return;
  }

  // Compute the 1D index for buffers
  let index: u32 = x + y * gridWidth;

  let leftIdx = (x - 1u) + y * gridWidth;
  let rightIdx = (x + 1u) + y * gridWidth;
  let bottomIdx = x + (y - 1u) * gridWidth;
  let topIdx = x + (y + 1u) * gridWidth;

  let leftVel = velocity[leftIdx].y;
  let rightVel = velocity[rightIdx].y;
  let bottomVel = velocity[bottomIdx].x;
  let topVel = velocity[topIdx].x;
  
  // Approximate curl (only z-component in 2D: curl = ∂v/∂x - ∂u/∂y)
  let curl = ((rightVel - leftVel) - (topVel - bottomVel));
  
  // Compute a confinement force that is proportional to the curl.
  // vorticity[index] = 0.5 * uGridSize.w * curl;
  vorticity[index] = 0.001 * uGridSize.w * curl;
}
`,Z=`@group(0) @binding(0) var<storage, read> velocity: array<vec2<f32>>;
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
  velOut[index] = velocity[index] + N;
}
`,$=`@group(0) @binding(0) var<storage, read> pressureBuf: array<f32>;
@group(0) @binding(1) var<storage, read_write> pressureOutBuf: array<f32>;
@group(0) @binding(2) var<uniform> uGridSize: vec4<f32>;
@group(0) @binding(3) var<uniform> uViscosity: f32;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  // Bounds check
  let x = global_id.x;
  let y = global_id.y;
  if (x == 0 || y == 0 || x >= (u32(uGridSize.x)) || y >= (u32(uGridSize.y))) {
    return;
  }

  // Compute the 1D index for buffers
  let index = x + y * u32(uGridSize.x);

  let decayedPressure = pressureBuf[index] * uViscosity;
  pressureOutBuf[index] = select(decayedPressure, 0.0, decayedPressure < 0.001);
}
`,ee=`/*
Enforces no-slip velocity boundary conditions by reflecting velocity components at the domain edges.
For boundary cells, samples velocity from the nearest interior cell and flips the appropriate component
(x or y) to simulate solid wall bounce-back.
*/

@group(0) @binding(0) var<storage, read> velIn: array<vec2<f32>>;
@group(0) @binding(1) var<storage, read_write> velOut: array<vec2<f32>>;
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
  let vel = velIn[neighborIndex];

  // Reflect the velocity components
  velOut[index] = vec2<f32>(vel.x * flipX, vel.y * flipY);
}
`,ne=`/*
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
`;function re(e,n){const r=e.createShaderModule({code:I});return e.createRenderPipeline({vertex:{module:r,entryPoint:"vs_main"},fragment:{module:r,entryPoint:"fs_main",targets:[{format:n}]},primitive:{topology:"triangle-strip"},layout:"auto"})}function ie(e){const n=e.createShaderModule({code:L});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function te(e){const n=e.createShaderModule({code:k});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function oe(e){const n=e.createShaderModule({code:N});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function ue(e){const n=e.createShaderModule({code:q});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function ae(e){const n=e.createShaderModule({code:X});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function de(e){const n=e.createShaderModule({code:j});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function se(e){const n=e.createShaderModule({code:H});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function le(e){const n=e.createShaderModule({code:K});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function ce(e){const n=e.createShaderModule({code:J});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function fe(e){const n=e.createShaderModule({code:Q});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function pe(e){const n=e.createShaderModule({code:Z});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function ge(e){const n=e.createShaderModule({code:$});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function ye(e){const n=e.createShaderModule({code:ee});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function me(e){const n=e.createShaderModule({code:ne});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function xe(e,n){const r=re(e,n),a=ie(e),t=te(e),u=oe(e),d=ue(e),c=ae(e),f=de(e),s=se(e),l=le(e),p=ce(e),y=fe(e),g=pe(e),m=ge(e),x=ye(e),v=me(e);return{renderPipeline:r,velPipeline:a,advectionPipeline:t,decayPipeline:u,velDecayPipeline:d,injectionPipeline:c,divPipeline:f,pressurePipeline:s,subPressurePipeline:l,advectVelPipeline:p,vorticityPipeline:y,addVorticityPipeline:g,clearPressurePipeline:m,velBoundaryPipeline:x,presBoundaryPipeline:v}}class ve{constructor(n,r,a){C(this,"pos",[0,0]);C(this,"vel",[0,0]);C(this,"isMouseDown",!1);let t=[0,0];n.addEventListener("mousedown",u=>{this.isMouseDown=!0;const d=n.getBoundingClientRect();t=[(u.clientX-d.left)/d.width,(u.clientY-d.top)/d.height]}),n.addEventListener("mouseup",()=>{this.isMouseDown=!1,this.vel=[0,0],this.updateGPUBuffer(r,a)}),n.addEventListener("mousemove",u=>{if(!this.isMouseDown)return;const d=n.getBoundingClientRect(),c=[(u.clientX-d.left)/d.width,(u.clientY-d.top)/d.height],f=20;for(let s=1;s<=f;s++){const l=s/(f+1),p=[t[0]+(c[0]-t[0])*l,t[1]+(c[1]-t[1])*l],y=[p[0]-t[0],p[1]-t[1]],g=[y[0]*5,y[1]*5],m=new Float32Array([p[0],p[1],g[0],g[1]]);r.queue.writeBuffer(a,0,m)}this.vel=[c[0]-t[0],c[1]-t[1]],this.pos=c,t=c,this.updateGPUBuffer(r,a)})}updateGPUBuffer(n,r){const t=[this.vel[0]*5,this.vel[1]*5],u=new Float32Array([this.pos[0],this.pos[1],t[0],t[1]]);n.queue.writeBuffer(r,0,u)}}function he(e){return e.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST})}function Be(e,n){return e.createBuffer({size:n*n*2*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC})}function be(e,n){return e.createBuffer({size:n*n*2*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC})}function Pe(e){return e.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}function Ge(e){return e.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}function Se(e){return e.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}function Ee(e,n){return e.createBuffer({size:n*n*4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC})}function _e(e,n){return e.createBuffer({size:n*n*4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC})}function ze(e){return e.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}function Ce(e){return e.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}function we(e){return e.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}function Ue(e){return e.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}function De(e){return e.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}function Te(e,n){return e.createBuffer({size:n*n*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC})}function Oe(e,n){return e.createBuffer({size:n*n*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC})}function Fe(e,n){return e.createBuffer({size:n*n*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC})}function Me(e,n){return e.createBuffer({size:n*n*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC})}function Ve(e,n){return e.createBuffer({size:n*n*2*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC})}function Re(e){return e.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}function Ye(e){return e.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}function Ae(e){return e.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}function We(e,n,r){const a=he(e),t=Be(e,n),u=be(e,n),d=Pe(e),c=Ge(e),f=Se(e),s=Ee(e,n),l=_e(e,n),p=ze(e),y=Ue(e),g=Ce(e),m=we(e),x=De(e),v=Te(e,n),w=Oe(e,n),U=Fe(e,n),D=Me(e,n),T=Ve(e,n),P=Re(e),G=Ye(e),S=Ae(e),O=new Float32Array([100.5,.5,.5,0]);e.queue.writeBuffer(y,0,O);const E=1/n,F=1/E,M=new Float32Array([n,n,E,F]),_=new Float32Array([2,0,0,0]),h=new Float32Array([.25,0,0,0]);e.queue.writeBuffer(d,0,M),e.queue.writeBuffer(c,0,_),e.queue.writeBuffer(f,0,h);const B=new Float32Array([.99,0,0,0]);e.queue.writeBuffer(g,0,B);const V=new Float32Array([1,0,0,0]);e.queue.writeBuffer(m,0,V);const o=new Float32Array([r.width,r.height]);e.queue.writeBuffer(x,0,o);const i=new Float32Array([500,0,0,0]);e.queue.writeBuffer(P,0,i);const z=new Float32Array([.8,0,0,0]);e.queue.writeBuffer(G,0,z);const b=new Float32Array([.99,0,0,0]);return e.queue.writeBuffer(S,0,b),{mouseBuf:a,velBuf:t,velOutBuf:u,gridSizeBuf:d,radiusBuf:c,strengthBuf:f,dyeFieldBuf:s,dyeFieldOutBuf:l,deltaTimeBuf:p,injectionAmtBuf:y,decayBuf:g,velDecayBuf:m,canvasSizeBuf:x,divBuf:v,pressureBuf:w,pressureOutBuf:U,vorticityBuf:D,vorticityForceBuf:T,vorticityStrengthBuf:P,viscosityBuf:G,diffusionBuf:S}}function Ie(e,n,r){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:r.velBuf}},{binding:1,resource:{buffer:r.mouseBuf}},{binding:2,resource:{buffer:r.gridSizeBuf}},{binding:3,resource:{buffer:r.radiusBuf}},{binding:4,resource:{buffer:r.strengthBuf}},{binding:5,resource:{buffer:r.deltaTimeBuf}},{binding:6,resource:{buffer:r.velOutBuf}},{binding:7,resource:{buffer:r.diffusionBuf}}]})}function Le(e,n,r){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:r.velBuf}},{binding:1,resource:{buffer:r.dyeFieldBuf}},{binding:2,resource:{buffer:r.dyeFieldOutBuf}},{binding:3,resource:{buffer:r.gridSizeBuf}},{binding:4,resource:{buffer:r.deltaTimeBuf}}]})}function ke(e,n,r){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:r.dyeFieldBuf}},{binding:1,resource:{buffer:r.mouseBuf}},{binding:2,resource:{buffer:r.injectionAmtBuf}},{binding:3,resource:{buffer:r.gridSizeBuf}},{binding:4,resource:{buffer:r.deltaTimeBuf}},{binding:5,resource:{buffer:r.diffusionBuf}},{binding:6,resource:{buffer:r.dyeFieldOutBuf}},{binding:7,resource:{buffer:r.strengthBuf}}]})}function Ne(e,n,r){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:r.gridSizeBuf}},{binding:1,resource:{buffer:r.dyeFieldBuf}},{binding:2,resource:{buffer:r.decayBuf}}]})}function qe(e,n,r){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:r.gridSizeBuf}},{binding:1,resource:{buffer:r.velBuf}},{binding:2,resource:{buffer:r.velDecayBuf}}]})}function Xe(e,n,r){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:r.velBuf}},{binding:1,resource:{buffer:r.divBuf}},{binding:2,resource:{buffer:r.gridSizeBuf}}]})}function je(e,n,r){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:r.divBuf}},{binding:1,resource:{buffer:r.pressureBuf}},{binding:2,resource:{buffer:r.gridSizeBuf}},{binding:3,resource:{buffer:r.pressureOutBuf}}]})}function He(e,n,r){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:r.velBuf}},{binding:1,resource:{buffer:r.pressureBuf}},{binding:2,resource:{buffer:r.gridSizeBuf}}]})}function Ke(e,n,r){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:r.velBuf}},{binding:1,resource:{buffer:r.velOutBuf}},{binding:2,resource:{buffer:r.gridSizeBuf}},{binding:3,resource:{buffer:r.deltaTimeBuf}}]})}function Je(e,n,r){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:r.velBuf}},{binding:1,resource:{buffer:r.gridSizeBuf}},{binding:2,resource:{buffer:r.vorticityBuf}}]})}function Qe(e,n,r){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:r.velBuf}},{binding:1,resource:{buffer:r.vorticityBuf}},{binding:2,resource:{buffer:r.gridSizeBuf}},{binding:3,resource:{buffer:r.vorticityStrengthBuf}},{binding:4,resource:{buffer:r.deltaTimeBuf}},{binding:5,resource:{buffer:r.velOutBuf}}]})}function Ze(e,n,r){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:r.pressureBuf}},{binding:1,resource:{buffer:r.pressureOutBuf}},{binding:2,resource:{buffer:r.gridSizeBuf}},{binding:3,resource:{buffer:r.viscosityBuf}}]})}function $e(e,n,r){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:r.velBuf}},{binding:1,resource:{buffer:r.velOutBuf}},{binding:2,resource:{buffer:r.gridSizeBuf}}]})}function en(e,n,r){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:r.pressureBuf}},{binding:1,resource:{buffer:r.pressureOutBuf}},{binding:2,resource:{buffer:r.gridSizeBuf}}]})}function nn(e,n,r){const a=Ie(e,n.velPipeline,r),t=Le(e,n.advectionPipeline,r),u=ke(e,n.injectionPipeline,r),d=Ne(e,n.decayPipeline,r),c=qe(e,n.velDecayPipeline,r),f=Xe(e,n.divPipeline,r),s=je(e,n.pressurePipeline,r),l=He(e,n.subPressurePipeline,r),p=Ke(e,n.advectVelPipeline,r),y=Je(e,n.vorticityPipeline,r),g=Qe(e,n.addVorticityPipeline,r),m=Ze(e,n.clearPressurePipeline,r),x=$e(e,n.velBoundaryPipeline,r),v=en(e,n.presBoundaryPipeline,r);return{velBindGroup:a,advectionBindGroup:t,injectionBindGroup:u,decayBindGroup:d,velDecayBindGroup:c,divBindGroup:f,pressureBindGroup:s,subPressureBindGroup:l,advectVelBindGroup:p,vorticityBindGroup:y,addVorticityBindGroup:g,clearPressureBindGroup:m,velBoundaryBindGroup:x,presBoundaryBindGroup:v}}function rn(e,n,r,a){const t=e.createCommandEncoder(),u=n.getCurrentTexture().createView(),d=t.beginRenderPass({colorAttachments:[{view:u,loadOp:"clear",storeOp:"store",clearValue:[0,0,0,1]}]});d.setPipeline(r),d.setBindGroup(0,a),d.draw(4),d.end(),e.queue.submit([t.finish()])}function tn({device:e,context:n,buffers:r,bindGroups:a,pipelines:t,mouseHandler:u,gridSize:d}){async function c(){m(e,r),u.isMouseDown&&(y(),h()),D(),h(),E(),h(),T(),P();for(let o=0;o<20;o++)G(),B(),w(),B();S(),B(),O(),B(),F(),M(),h(),v(),h(),u.isMouseDown&&(p(),_()),x(),_(),U(),rn(e,n,t.renderPipeline,V()),requestAnimationFrame(c)}const f=8,s=Math.ceil(d/f),l=Math.ceil(d/f);function p(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(t.injectionPipeline),i.setBindGroup(0,a.injectionBindGroup),i.dispatchWorkgroups(s,l),i.end(),e.queue.submit([o.finish()])}function y(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(t.velPipeline),i.setBindGroup(0,a.velBindGroup),i.dispatchWorkgroups(s,l),i.end(),e.queue.submit([o.finish()])}let g=performance.now();function m(o,i){const z=performance.now();let b=(z-g)/1e3;g=z,b>1/60&&(b=1/60);const R=new Float32Array([b]);o.queue.writeBuffer(i.deltaTimeBuf,0,R)}function x(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(t.advectionPipeline),i.setBindGroup(0,a.advectionBindGroup),i.dispatchWorkgroups(s,l),i.end(),e.queue.submit([o.finish()])}function v(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(t.velBoundaryPipeline),i.setBindGroup(0,a.velBoundaryBindGroup),i.dispatchWorkgroups(s,l),i.end(),e.queue.submit([o.finish()])}function w(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(t.presBoundaryPipeline),i.setBindGroup(0,a.presBoundaryBindGroup),i.dispatchWorkgroups(s,l),i.end(),e.queue.submit([o.finish()])}function U(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(t.decayPipeline),i.setBindGroup(0,a.decayBindGroup),i.dispatchWorkgroups(s,l),i.end(),e.queue.submit([o.finish()])}function D(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(t.velDecayPipeline),i.setBindGroup(0,a.velDecayBindGroup),i.dispatchWorkgroups(s,l),i.end(),e.queue.submit([o.finish()])}function T(){const o=new Float32Array(d*d).fill(0);e.queue.writeBuffer(r.divBuf,0,o)}function P(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(t.divPipeline),i.setBindGroup(0,a.divBindGroup),i.dispatchWorkgroups(s,l),i.end(),e.queue.submit([o.finish()])}function G(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(t.pressurePipeline),i.setBindGroup(0,a.pressureBindGroup),i.dispatchWorkgroups(s,l),i.end(),e.queue.submit([o.finish()])}function S(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(t.subPressurePipeline),i.setBindGroup(0,a.subPressureBindGroup),i.dispatchWorkgroups(s,l),i.end(),e.queue.submit([o.finish()])}function O(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(t.clearPressurePipeline),i.setBindGroup(0,a.clearPressureBindGroup),i.dispatchWorkgroups(s,l),i.end(),e.queue.submit([o.finish()])}function E(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(t.advectVelPipeline),i.setBindGroup(0,a.advectVelBindGroup),i.dispatchWorkgroups(s,l),i.end(),e.queue.submit([o.finish()])}function F(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(t.vorticityPipeline),i.setBindGroup(0,a.vorticityBindGroup),i.dispatchWorkgroups(s,l),i.end(),e.queue.submit([o.finish()])}function M(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(t.addVorticityPipeline),i.setBindGroup(0,a.addVorticityBindGroup),i.dispatchWorkgroups(s,l),i.end(),e.queue.submit([o.finish()])}function _(){const o=e.createCommandEncoder();o.copyBufferToBuffer(r.dyeFieldOutBuf,0,r.dyeFieldBuf,0,r.dyeFieldBuf.size),e.queue.submit([o.finish()])}function h(){const o=e.createCommandEncoder();o.copyBufferToBuffer(r.velOutBuf,0,r.velBuf,0,r.velBuf.size),e.queue.submit([o.finish()])}function B(){const o=e.createCommandEncoder();o.copyBufferToBuffer(r.pressureOutBuf,0,r.pressureBuf,0,r.pressureBuf.size),e.queue.submit([o.finish()])}function V(){return e.createBindGroup({layout:t.renderPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:r.gridSizeBuf}},{binding:1,resource:{buffer:r.canvasSizeBuf}},{binding:2,resource:{buffer:r.dyeFieldBuf}}]})}c()}async function on(){const e=document.createElement("canvas");e.width=window.innerWidth,e.height=window.innerHeight,document.body.appendChild(e);const{device:n,context:r,format:a}=await W(e),t=512,u=We(n,t,e),d=xe(n,a),c=nn(n,d,u),f=new ve(e,n,u.mouseBuf);tn({device:n,context:r,buffers:u,bindGroups:c,pipelines:d,mouseHandler:f,gridSize:t})}on();
