var I=Object.defineProperty;var A=(e,n,t)=>n in e?I(e,n,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[n]=t;var C=(e,n,t)=>A(e,typeof n!="symbol"?n+"":n,t);(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))a(r);new MutationObserver(r=>{for(const u of r)if(u.type==="childList")for(const s of u.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&a(s)}).observe(document,{childList:!0,subtree:!0});function t(r){const u={};return r.integrity&&(u.integrity=r.integrity),r.referrerPolicy&&(u.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?u.credentials="include":r.crossOrigin==="anonymous"?u.credentials="omit":u.credentials="same-origin",u}function a(r){if(r.ep)return;r.ep=!0;const u=t(r);fetch(r.href,u)}})();async function W(e){const n=document.getElementById("gpu-status");if(!navigator.gpu)throw console.error("WebGPU not supported on this browser."),n&&(n.innerText="WebGPU not supported!"),new Error("WebGPU not supported.");const t=await navigator.gpu.requestAdapter();if(!t)throw console.error("No appropriate GPUAdapter found."),n&&(n.innerText="No compatible GPU found!"),new Error("No appropriate GPUAdapter found.");const a=await t.requestDevice();if(!a)throw console.error("Failed to get WebGPU device."),n&&(n.innerText="Failed to initialize WebGPU!"),new Error("Failed to get WebGPU device.");console.log("WebGPU initialized successfully!"),n&&(n.innerText="WebGPU is working!");const r=e.getContext("webgpu"),u=navigator.gpu.getPreferredCanvasFormat();return r.configure({device:a,format:u}),{device:a,context:r,format:u}}const Y=`// Fullscreen Dye Render shader (vertex + fragment)
/* This shader renders the dye field to the screen using a fullscreen quad.

   Vertex Stage (\`vs_main\`):
     - Defines a fullscreen quad by assigning clip-space positions to vertices.
     - No input buffers are needed; the positions are hardcoded.

   Fragment Stage (\`fs_main\`):
     1. Converts screen-space fragment coordinates to normalized UVs.
     2. Maps UVs to grid coordinates for dye lookup.
     3. Samples the dye field at the mapped position using bilinear interpolation.
     4. Applies gamma correction (soft contrast) to the RGB channels.
     5. Computes alpha based on dye intensity for visual clarity.
     6. Outputs the final RGBA color for rendering.

   This shader enables real-time visualization of the simulation’s dye field on the canvas.
*/

@vertex
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
@group(0) @binding(0) var<uniform> uGridSize: vec2<f32>;
@group(0) @binding(1) var<uniform> canvasSize: vec2<f32>;
@group(0) @binding(2) var<storage, read> dye: array<vec3<f32>>;

// Bilinear interpolation

fn sampleDye(pos: vec2<f32>) -> vec3<f32> {
  let x0 = floor(pos.x);
  let y0 = floor(pos.y);
  let x1 = x0 + 1.0;
  let y1 = y0 + 1.0;

  let fx = pos.x - x0;
  let fy = pos.y - y0;

  let i0 = u32(x0 + y0 * uGridSize.x);
  let i1 = u32(x1 + y0 * uGridSize.x);
  let i2 = u32(x0 + y1 * uGridSize.x);
  let i3 = u32(x1 + y1 * uGridSize.x);

  let v0 = dye[i0];
  let v1 = dye[i1];
  let v2 = dye[i2];
  let v3 = dye[i3];

  let interpX0 = mix(v0, v1, fx);
  let interpX1 = mix(v2, v3, fx);
  return mix(interpX0, interpX1, fy);
}

@fragment
fn fs_main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
  // Normalize by canvas size (0 - 1)
  let uv = fragCoord.xy / canvasSize;

  // Map the normalized coordinates to grid coordinates
  let gridPos = clamp(uv * uGridSize, vec2<f32>(0.0), uGridSize - vec2<f32>(2.0));

  let dyeVal = sampleDye(gridPos);

  let brightness = pow(dyeVal, vec3<f32>(0.5));          // soft contrast
  let alpha = clamp(length(dyeVal) * 2.0, 0.0, 1.0);  // opacity ramp

  return vec4<f32>(brightness, alpha);
}
`,k=`// Velocity Injection compute shader
/* This shader injects external forces into the velocity field based on mouse motion,
   using an anisotropic Gaussian splatting approach aligned with the direction of movement.

   For each non-boundary grid cell:
     1. Computes the distance from the cell to the mouse position.
     2. Applies a **directional Gaussian falloff** scaled by distance and mouse velocity.
     3. Computes an influence vector and adds it to the current velocity at that cell.
     4. Scales the influence by time step and a strength factor to control the injection intensity.

   This allows dynamic interaction with the fluid, simulating swirling, pushing, or dragging effects.
*/

// Stores vel values for each cell -- read and write access
@group(0) @binding(0) var<storage, read> velocityIn : array<vec2<f32>>;

// Stores mouse position (xy) and velocity (zw)
@group(0) @binding(1) var<uniform> uMouse : vec4<f32>; // (posX, posY, velX, velY)

// Stores grid dimensions
@group(0) @binding(2) var<uniform> uGridSize : vec2<f32>;

// Stores the radius within which the force can spread
@group(0) @binding(3) var<uniform> uRadius : f32;

// Stores the strength of the applied force
@group(0) @binding(4) var<uniform> uStrength : f32;

// Stores deltaTime (time between frames)
@group(0) @binding(5) var<uniform> uDeltaTime : f32;

@group(0) @binding(6) var<storage, read_write> velocityOut : array<vec2<f32>>;

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
    let pos = vec2<f32>(f32(x), f32(y));// / uGridSize.xy;

    // let mousePosGrid = uMouse.xy * uGridSize.xy; // convert mouse position to grid space coordinates
    let mousePos = uMouse.xy * uGridSize.xy;
    let mouseVel = uMouse.zw * uStrength * uGridSize.xy; // amplify mouse velocity by strength for effect

    let influence = gaussianWeight(pos, mousePos, mouseVel, uRadius);
    velocityOut[index] = velocityIn[index] + influence * uDeltaTime * 100.0; // amplify the effect by 100.0 to move the dye
}
`,L=`// Dye Advection compute shader
/* This shader performs semi-Lagrangian advection of a dye field over a 2D grid.
   Advection transports dye based on the local velocity field by tracing each grid cell backward in time to sample its previous state.

   For each non-boundary grid cell:
     1. Retrieves the velocity at the current cell using bilinear interpolation over the velocity field.
     2. Computes the backtraced position from which the fluid at this cell
        originated using Euler integration (\`pos - velocity * dt * rdx\`).
     3. Clamps this position to remain within the grid domain.
     4. Uses bilinear interpolation to sample the dye field at the backtraced position.
     5. Writes the resulting dye value into the output buffer (\`dyeOut\`), enabling ping-pong updates between frames.
*/

@group(0) @binding(0) var<storage, read> velocity: array<vec2<f32>>;
// read-only current dye field (e.g. a float per cell, representing density)
@group(0) @binding(1) var<storage, read> dyeIn: array<vec3<f32>>;
// for ping-pong update
@group(0) @binding(2) var<storage, read_write> dyeOut: array<vec3<f32>>;
@group(0) @binding(3) var<uniform> uGridSize: vec4<f32>; // (gridWidth, gridHeight, dx, rdx)
@group(0) @binding(4) var<uniform> uDeltaTime: f32;

// Bilinear interpolation
fn sampleDye(pos: vec2<f32>) -> vec3<f32> {
  let x0f = floor(pos.x);
  let y0f = floor(pos.y);
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
  let v0 = dyeIn[u32(i0)];
  let v1 = dyeIn[u32(i1)];
  let v2 = dyeIn[u32(i2)];
  let v3 = dyeIn[u32(i3)];

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
  let v0 = velocity[i0];
  let v1 = velocity[i1];
  let v2 = velocity[i2];
  let v3 = velocity[i3];

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
  let v = sampleVelocity(pos);

  let displacement = v * (uDeltaTime * uGridSize.w);
  
  // Semi-Lagrangian backtrace
  // Calculate the position where the fluid at this cell came from
  // Euler backtracing  -- TODO: explore other time integration methods? Runge Kutta?
  let backPos = pos - displacement; //v * uDeltaTime;
  
  // Clamp the backtraced position to be within the grid bounds
  let clampedPos = clamp(backPos, vec2<f32>(0.0), uGridSize.xy - vec2<f32>(1.0));

  dyeOut[index] = sampleDye(clampedPos);
}
`,N=`// Dye Decay compute shader
/* This shader applies exponential decay to the dye field, simulating natural dissipation over time.

   For each non-boundary grid cell:
     1. Reads the current dye value.
     2. Multiplies it by a user-defined decay rate (\`uDyeDecayRate\`).
     3. Writes the result back to the same location in the dye buffer.

   This step helps prevent dye from building up indefinitely in the simulation.
*/

@group(0) @binding(0) var<uniform> uGridSize: vec4<f32>;;
@group(0) @binding(1) var<storage, read_write> dye: array<vec3<f32>>;
@group(0) @binding(2) var<uniform> uDyeDecayRate: f32;

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

  let decayedDye = dye[index] * uDyeDecayRate;
  dye[index] = decayedDye;
}`,q=`// Velocity Decay compute shader
/* This shader applies exponential decay to the velocity field, simulating friction or air resistance over time.

   For each non-boundary grid cell:
     1. Scales the current velocity vector by a decay factor (\`uVelocityDecayRate\`).
     2. If the resulting velocity magnitude falls below a small threshold (\`< 0.0001\`), clamps it to zero.
     3. Writes the updated velocity back to the buffer.

   This helps stabilize the fluid by damping residual motion.
*/

@group(0) @binding(0) var<uniform> uGridSize: vec4<f32>;
@group(0) @binding(1) var<storage, read_write> velocity: array<vec2<f32>>;
@group(0) @binding(2) var<uniform> uVelocityDecayRate: f32;

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

  let decayedVel = velocity[index] * uVelocityDecayRate;
  velocity[index] = select(decayedVel, vec2<f32>(0.0), length(decayedVel) < 0.0001);
}`,j=`// Dye Injection compute shader
/* This shader injects dye into the simulation grid based on mouse input,
   simulating external forces like ink or smoke being added to the fluid.

   For each non-boundary grid cell:
     1. Computes the distance from the cell to the mouse position (in grid units).
     2. Applies a **Gaussian falloff** based on distance and mouse velocity to control dye influence.
     3. Computes a dye color based on the injection direction using HSV-to-RGB mapping (directional hue).
     4. Scales the dye injection by strength, amount, delta time, and local velocity.
     5. Adds the injected dye to the current dye value and clamps it to a maximum.

   This creates smooth, directional color trails that respond dynamically to user input.
*/

@group(0) @binding(0) var<storage, read> dyeIn: array<vec3<f32>>;
@group(0) @binding(1) var<uniform> uMouse : vec4<f32>; // (posX, posY, velX, velY)
@group(0) @binding(2) var<uniform> uInjectionAmount: f32;
@group(0) @binding(3) var<uniform> uGridSize: vec4<f32>; // (gridWidth, gridHeight, dx, rdx)
@group(0) @binding(4) var<uniform> uDeltaTime : f32;
@group(0) @binding(5) var<storage, read_write> dyeOut: array<vec3<f32>>;
@group(0) @binding(6) var<uniform> uStrength : f32;
@group(0) @binding(7) var<uniform> uRadius : f32; // injection radius in grid units – within which injection occurs.

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

  // Distance from cell to the injection position
  let mousePos = uMouse.xy * uGridSize.xy;
  let mouseVel = uMouse.zw * uStrength * uGridSize.xy;

  // Gaussian weight for smoother injection
  let weight = gaussianWeight(pos, mousePos, mouseVel, uRadius);

  // Color logic — direction or time based hue
  let angle = atan2(mouseVel.y, mouseVel.x); // range (-π, π)
  let hue = fract(angle / (2.0 * 3.14159265)); // normalize to [0,1]
  let rgbColor = hsv2rgb(vec3<f32>(hue, 1.0, 1.0));

  // Inject and blend dye
  let current = dyeIn[index];
  let injected = rgbColor * uInjectionAmount * weight * uDeltaTime;
  dyeOut[index] = clamp(injected + current, vec3<f32>(0.0), vec3<f32>(10.0));
}`,X=`// Divergence compute shader
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
`,H=`// Pressure Solve compute shader
/* This shader performs one Jacobi iteration to solve the pressure Poisson equation,
   which is used to enforce incompressibility in the fluid by removing divergence.

   For each non-boundary grid cell:
     1. Samples the pressure values from the four neighboring cells (left, right, top, bottom),
        using clamping to handle boundary conditions.
     2. Combines the neighbor pressures with the local divergence value.
     3. Applies the Jacobi update formula:
        \`newPressure = (alpha * divergence + sum of neighbors) * 0.25\`
     4. Writes the updated pressure to the output buffer (\`pressureOut\`).

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
`,J=`// Subtract Pressure Gradient compute shader
/* This shader enforces incompressibility by subtracting the pressure gradient
   from the velocity field, ensuring that the updated velocity field is divergence-free.

   For each non-boundary grid cell:
     1. Samples neighboring pressure values (left, right, top, bottom) with clamping.
     2. Computes the pressure gradient using central finite differences.
     3. Scales the gradient by \`0.5 * rdx\` (from \`uGridSize.w\`) to match spatial resolution.
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
`,K=`// Velocity Advection compute shader
/* This shader performs semi-Lagrangian advection of the velocity field itself.
   Each velocity vector is updated by tracing backward through the field to determine where it came from.

   For each non-boundary grid cell:
     1. Reads the velocity vector at the current cell.
     2. Computes the backtraced position using Euler integration (\`pos - velocity * dt * rdx\`).
     3. Uses bilinear interpolation to sample the velocity field at the backtraced position.
     4. Writes the result to the output buffer (\`velocityOut\`) for use in the next simulation step.
*/

@group(0) @binding(0) var<storage, read> velocityIn: array<vec2<f32>>;
@group(0) @binding(1) var<storage, read_write> velocityOut: array<vec2<f32>>;
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

  let v0 = velocityIn[i0];
  let v1 = velocityIn[i1];
  let v2 = velocityIn[i2];
  let v3 = velocityIn[i3];

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
  
  let v = velocityIn[index];
  
  // Compute the backtraced position (semi-Lagrangian method)
  let backPos = pos - v * uDeltaTime * uGridSize.w;

  // Bilinear Interpolation
  velocityOut[index] = sampleVelocity(backPos);
}
`,Q=`// Vorticity Computation compute shader
/* This shader computes the scalar vorticity (z-component of the curl) of the 2D velocity field.
   Vorticity is used to identify swirling motion and later apply confinement forces.

   For each non-boundary grid cell:
     1. Fetches the vertical (y) velocity from left and right neighbors.
     2. Fetches the horizontal (x) velocity from bottom and top neighbors.
     3. Approximates the 2D curl as: (∂v/∂x - ∂u/∂y).
     4. Scales the result and writes it to the \`vorticity\` buffer.

   This value is used later in vorticity confinement to preserve fluid swirls.
*/

@group(0) @binding(0) var<storage, read> velocity: array<vec2<f32>>;
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
  vorticity[index] = 0.001 * uGridSize.w * curl;
}
`,Z=`// Vorticity Confinement compute shader
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
    6. Applies this confinement force to the velocity field and stores the result in \`velocityOut\`.

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
`,$=`// Pressure Decay compute shader
/* This shader applies decay to the pressure field to simulate viscosity and dampen residual pressure over time.

   For each non-boundary grid cell:
     1. Multiplies the current pressure value by a user-defined viscosity factor (\`uViscosity\`).
     2. If the resulting value falls below a small threshold (\`< 0.001\`), clamps it to zero.
     3. Writes the result back to the pressure buffer.

   This helps reduce lingering pressure artifacts and ensures smoother simulation behavior.
*/

@group(0) @binding(0) var<storage, read_write> pressure: array<f32>;
@group(0) @binding(1) var<uniform> uGridSize: vec4<f32>;
@group(0) @binding(2) var<uniform> uViscosity: f32;

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

  let decayedPressure = pressure[index] * uViscosity;
  pressure[index] = select(decayedPressure, 0.0, decayedPressure < 0.001);
}
`,ee=`// Enforce Velocity Boundary compute shader
/* This shader enforces no-slip boundary conditions on the velocity field by reflecting
   velocity components at the edges of the simulation domain to simulate solid wall bounce-back.

   For each boundary grid cell:
     1. Samples velocity from the nearest interior cell.
     2. Flips the velocity component normal to the boundary (x or y) to simulate reversal.
     3. Writes the reflected velocity to the output buffer (\`velocityOut\`).

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
`,ne=`// Enforce Pressure Boundary compute shader
/* This shader enforces Neumann boundary conditions (zero-gradient) on the pressure field
   by copying pressure values from adjacent interior cells to boundary cells.

   For each boundary grid cell:
     1. Identifies the nearest valid interior cell.
     2. Copies the pressure value from that cell into the current boundary cell in \`pressureOut\`.

   This prevents artificial pressure buildup at the edges of the simulation domain
   and ensures stable behavior by maintaining a flat pressure gradient at the boundaries.
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
`;function te(e,n){const t=e.createShaderModule({code:Y});return e.createRenderPipeline({vertex:{module:t,entryPoint:"vs_main"},fragment:{module:t,entryPoint:"fs_main",targets:[{format:n}]},primitive:{topology:"triangle-strip"},layout:"auto"})}function ie(e){const n=e.createShaderModule({code:k});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function re(e){const n=e.createShaderModule({code:L});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function oe(e){const n=e.createShaderModule({code:N});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function ue(e){const n=e.createShaderModule({code:q});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function ae(e){const n=e.createShaderModule({code:j});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function se(e){const n=e.createShaderModule({code:X});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function de(e){const n=e.createShaderModule({code:H});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function ce(e){const n=e.createShaderModule({code:J});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function le(e){const n=e.createShaderModule({code:K});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function fe(e){const n=e.createShaderModule({code:Q});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function pe(e){const n=e.createShaderModule({code:Z});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function ye(e){const n=e.createShaderModule({code:$});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function ge(e){const n=e.createShaderModule({code:ee});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function me(e){const n=e.createShaderModule({code:ne});return e.createComputePipeline({compute:{module:n,entryPoint:"main"},layout:"auto"})}function he(e,n){const t=te(e,n),a=ie(e),r=re(e),u=oe(e),s=ue(e),l=ae(e),f=se(e),d=de(e),c=ce(e),p=le(e),g=fe(e),y=pe(e),m=ye(e),h=ge(e),v=me(e);return{renderPipeline:t,injectVelocityPipeline:a,advectDyePipeline:r,decayDyePipeline:u,decayVelocityPipeline:s,injectDyePipeline:l,divPipeline:f,pressurePipeline:d,subtractPressureGradientPipeline:c,advectVelocityPipeline:p,computeVorticityPipeline:g,addVorticityConfinementPipeline:y,decayPressurePipeline:m,enforceVelocityBoundaryPipeline:h,enforcePressureBoundaryPipeline:v}}class ve{constructor(n,t,a){C(this,"pos",[0,0]);C(this,"vel",[0,0]);C(this,"isMouseDown",!1);let r=[0,0];n.addEventListener("mousedown",u=>{this.isMouseDown=!0;const s=n.getBoundingClientRect();r=[(u.clientX-s.left)/s.width,(u.clientY-s.top)/s.height]}),n.addEventListener("mouseup",()=>{this.isMouseDown=!1,this.vel=[0,0],this.updateGPUBuffer(t,a)}),n.addEventListener("mousemove",u=>{if(!this.isMouseDown)return;const s=n.getBoundingClientRect(),l=[(u.clientX-s.left)/s.width,(u.clientY-s.top)/s.height],f=20;for(let d=1;d<=f;d++){const c=d/(f+1),p=[r[0]+(l[0]-r[0])*c,r[1]+(l[1]-r[1])*c],g=[p[0]-r[0],p[1]-r[1]],y=[g[0]*5,g[1]*5],m=new Float32Array([p[0],p[1],y[0],y[1]]);t.queue.writeBuffer(a,0,m)}this.vel=[l[0]-r[0],l[1]-r[1]],this.pos=l,r=l,this.updateGPUBuffer(t,a)})}updateGPUBuffer(n,t){const r=[this.vel[0]*5,this.vel[1]*5],u=new Float32Array([this.pos[0],this.pos[1],r[0],r[1]]);n.queue.writeBuffer(t,0,u)}}function be(e){return e.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST})}function xe(e,n){return e.createBuffer({size:n*n*2*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC})}function Be(e,n){return e.createBuffer({size:n*n*2*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC})}function Pe(e){return e.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}function Ge(e){return e.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}function Se(e){return e.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}function Ce(e,n){return e.createBuffer({size:n*n*4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC})}function Ee(e,n){return e.createBuffer({size:n*n*4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC})}function _e(e){return e.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}function ze(e){return e.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}function we(e){return e.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}function De(e){return e.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}function Te(e){return e.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}function Ue(e,n){return e.createBuffer({size:n*n*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC})}function Ve(e,n){return e.createBuffer({size:n*n*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC})}function Oe(e,n){return e.createBuffer({size:n*n*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC})}function Fe(e,n){return e.createBuffer({size:n*n*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC})}function Me(e,n){return e.createBuffer({size:n*n*2*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC})}function Re(e){return e.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}function Ie(e){return e.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}function Ae(e,n,t){const a=be(e),r=xe(e,n),u=Be(e,n),s=Pe(e),l=Ge(e),f=Se(e),d=Ce(e,n),c=Ee(e,n),p=_e(e),g=De(e),y=ze(e),m=we(e),h=Te(e),v=Ue(e,n),E=Ve(e,n),_=Oe(e,n),z=Fe(e,n),w=Me(e,n),B=Re(e),P=Ie(e),D=new Float32Array([500,.5,.5,0]);e.queue.writeBuffer(g,0,D);const G=1/n,T=1/G,U=new Float32Array([n,n,G,T]),V=new Float32Array([2,0,0,0]),S=new Float32Array([.25,0,0,0]);e.queue.writeBuffer(s,0,U),e.queue.writeBuffer(l,0,V),e.queue.writeBuffer(f,0,S);const b=new Float32Array([.99,0,0,0]);e.queue.writeBuffer(y,0,b);const x=new Float32Array([.999,0,0,0]);e.queue.writeBuffer(m,0,x);const O=new Float32Array([t.width,t.height]);e.queue.writeBuffer(h,0,O);const o=new Float32Array([500,0,0,0]);e.queue.writeBuffer(B,0,o);const i=new Float32Array([.8,0,0,0]);return e.queue.writeBuffer(P,0,i),{mouseBuf:a,velBuf:r,velOutBuf:u,gridSizeBuf:s,radiusBuf:l,strengthBuf:f,dyeFieldBuf:d,dyeFieldOutBuf:c,deltaTimeBuf:p,injectionAmtBuf:g,dyeDecayBuf:y,velDecayBuf:m,canvasSizeBuf:h,divBuf:v,pressureBuf:E,pressureOutBuf:_,vorticityBuf:z,vorticityForceBuf:w,vorticityStrengthBuf:B,viscosityBuf:P}}function We(e,n,t){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t.velBuf}},{binding:1,resource:{buffer:t.mouseBuf}},{binding:2,resource:{buffer:t.gridSizeBuf}},{binding:3,resource:{buffer:t.radiusBuf}},{binding:4,resource:{buffer:t.strengthBuf}},{binding:5,resource:{buffer:t.deltaTimeBuf}},{binding:6,resource:{buffer:t.velOutBuf}}]})}function Ye(e,n,t){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t.velBuf}},{binding:1,resource:{buffer:t.dyeFieldBuf}},{binding:2,resource:{buffer:t.dyeFieldOutBuf}},{binding:3,resource:{buffer:t.gridSizeBuf}},{binding:4,resource:{buffer:t.deltaTimeBuf}}]})}function ke(e,n,t){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t.dyeFieldBuf}},{binding:1,resource:{buffer:t.mouseBuf}},{binding:2,resource:{buffer:t.injectionAmtBuf}},{binding:3,resource:{buffer:t.gridSizeBuf}},{binding:4,resource:{buffer:t.deltaTimeBuf}},{binding:5,resource:{buffer:t.dyeFieldOutBuf}},{binding:6,resource:{buffer:t.strengthBuf}},{binding:7,resource:{buffer:t.radiusBuf}}]})}function Le(e,n,t){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t.gridSizeBuf}},{binding:1,resource:{buffer:t.dyeFieldBuf}},{binding:2,resource:{buffer:t.dyeDecayBuf}}]})}function Ne(e,n,t){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t.gridSizeBuf}},{binding:1,resource:{buffer:t.velBuf}},{binding:2,resource:{buffer:t.velDecayBuf}}]})}function qe(e,n,t){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t.velBuf}},{binding:1,resource:{buffer:t.divBuf}},{binding:2,resource:{buffer:t.gridSizeBuf}}]})}function je(e,n,t){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t.divBuf}},{binding:1,resource:{buffer:t.pressureBuf}},{binding:2,resource:{buffer:t.gridSizeBuf}},{binding:3,resource:{buffer:t.pressureOutBuf}}]})}function Xe(e,n,t){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t.velBuf}},{binding:1,resource:{buffer:t.pressureBuf}},{binding:2,resource:{buffer:t.gridSizeBuf}}]})}function He(e,n,t){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t.velBuf}},{binding:1,resource:{buffer:t.velOutBuf}},{binding:2,resource:{buffer:t.gridSizeBuf}},{binding:3,resource:{buffer:t.deltaTimeBuf}}]})}function Je(e,n,t){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t.velBuf}},{binding:1,resource:{buffer:t.gridSizeBuf}},{binding:2,resource:{buffer:t.vorticityBuf}}]})}function Ke(e,n,t){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t.velBuf}},{binding:1,resource:{buffer:t.vorticityBuf}},{binding:2,resource:{buffer:t.gridSizeBuf}},{binding:3,resource:{buffer:t.vorticityStrengthBuf}},{binding:4,resource:{buffer:t.deltaTimeBuf}},{binding:5,resource:{buffer:t.velOutBuf}}]})}function Qe(e,n,t){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t.pressureBuf}},{binding:1,resource:{buffer:t.gridSizeBuf}},{binding:2,resource:{buffer:t.viscosityBuf}}]})}function Ze(e,n,t){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t.velBuf}},{binding:1,resource:{buffer:t.velOutBuf}},{binding:2,resource:{buffer:t.gridSizeBuf}}]})}function $e(e,n,t){return e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t.pressureBuf}},{binding:1,resource:{buffer:t.pressureOutBuf}},{binding:2,resource:{buffer:t.gridSizeBuf}}]})}function en(e,n,t){const a=We(e,n.injectVelocityPipeline,t),r=Ye(e,n.advectDyePipeline,t),u=ke(e,n.injectDyePipeline,t),s=Le(e,n.decayDyePipeline,t),l=Ne(e,n.decayVelocityPipeline,t),f=qe(e,n.divPipeline,t),d=je(e,n.pressurePipeline,t),c=Xe(e,n.subtractPressureGradientPipeline,t),p=He(e,n.advectVelocityPipeline,t),g=Je(e,n.computeVorticityPipeline,t),y=Ke(e,n.addVorticityConfinementPipeline,t),m=Qe(e,n.decayPressurePipeline,t),h=Ze(e,n.enforceVelocityBoundaryPipeline,t),v=$e(e,n.enforcePressureBoundaryPipeline,t);return{injectVelocityBindGroup:a,advectDyeBindGroup:r,injectDyeBindGroup:u,decayDyeBindGroup:s,decayVelocityBindGroup:l,divBindGroup:f,pressureBindGroup:d,subtractPressureGradientBindGroup:c,advectVelocityBindGroup:p,computeVorticityBindGroup:g,addVorticityConfinementBindGroup:y,decayPressureBindGroup:m,enforceVelocityBoundaryBindGroup:h,enforcePressureBoundaryBindGroup:v}}function nn(e,n,t,a){const r=e.createCommandEncoder(),u=n.getCurrentTexture().createView(),s=r.beginRenderPass({colorAttachments:[{view:u,loadOp:"clear",storeOp:"store",clearValue:[0,0,0,1]}]});s.setPipeline(t),s.setBindGroup(0,a),s.draw(4),s.end(),e.queue.submit([r.finish()])}function tn({device:e,context:n,buffers:t,bindGroups:a,pipelines:r,mouseHandler:u,gridSize:s}){async function l(){m(e,t),u.isMouseDown&&(g(),b()),z(),T(),b(),w(),B();for(let o=0;o<20;o++)P(),x(),E(),x();D(),x(),G(),U(),V(),b(),v(),b(),u.isMouseDown&&(p(),S()),h(),S(),_(),nn(e,n,r.renderPipeline,O()),requestAnimationFrame(l)}const f=8,d=Math.ceil(s/f),c=Math.ceil(s/f);function p(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(r.injectDyePipeline),i.setBindGroup(0,a.injectDyeBindGroup),i.dispatchWorkgroups(d,c),i.end(),e.queue.submit([o.finish()])}function g(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(r.injectVelocityPipeline),i.setBindGroup(0,a.injectVelocityBindGroup),i.dispatchWorkgroups(d,c),i.end(),e.queue.submit([o.finish()])}let y=performance.now();function m(o,i){const M=performance.now();let F=(M-y)/1e3;y=M,F>1/60&&(F=1/60);const R=new Float32Array([F]);o.queue.writeBuffer(i.deltaTimeBuf,0,R)}function h(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(r.advectDyePipeline),i.setBindGroup(0,a.advectDyeBindGroup),i.dispatchWorkgroups(d,c),i.end(),e.queue.submit([o.finish()])}function v(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(r.enforceVelocityBoundaryPipeline),i.setBindGroup(0,a.enforceVelocityBoundaryBindGroup),i.dispatchWorkgroups(d,c),i.end(),e.queue.submit([o.finish()])}function E(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(r.enforcePressureBoundaryPipeline),i.setBindGroup(0,a.enforcePressureBoundaryBindGroup),i.dispatchWorkgroups(d,c),i.end(),e.queue.submit([o.finish()])}function _(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(r.decayDyePipeline),i.setBindGroup(0,a.decayDyeBindGroup),i.dispatchWorkgroups(d,c),i.end(),e.queue.submit([o.finish()])}function z(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(r.decayVelocityPipeline),i.setBindGroup(0,a.decayVelocityBindGroup),i.dispatchWorkgroups(d,c),i.end(),e.queue.submit([o.finish()])}function w(){const o=new Float32Array(s*s).fill(0);e.queue.writeBuffer(t.divBuf,0,o)}function B(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(r.divPipeline),i.setBindGroup(0,a.divBindGroup),i.dispatchWorkgroups(d,c),i.end(),e.queue.submit([o.finish()])}function P(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(r.pressurePipeline),i.setBindGroup(0,a.pressureBindGroup),i.dispatchWorkgroups(d,c),i.end(),e.queue.submit([o.finish()])}function D(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(r.subtractPressureGradientPipeline),i.setBindGroup(0,a.subtractPressureGradientBindGroup),i.dispatchWorkgroups(d,c),i.end(),e.queue.submit([o.finish()])}function G(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(r.decayPressurePipeline),i.setBindGroup(0,a.decayPressureBindGroup),i.dispatchWorkgroups(d,c),i.end(),e.queue.submit([o.finish()])}function T(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(r.advectVelocityPipeline),i.setBindGroup(0,a.advectVelocityBindGroup),i.dispatchWorkgroups(d,c),i.end(),e.queue.submit([o.finish()])}function U(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(r.computeVorticityPipeline),i.setBindGroup(0,a.computeVorticityBindGroup),i.dispatchWorkgroups(d,c),i.end(),e.queue.submit([o.finish()])}function V(){const o=e.createCommandEncoder(),i=o.beginComputePass();i.setPipeline(r.addVorticityConfinementPipeline),i.setBindGroup(0,a.addVorticityConfinementBindGroup),i.dispatchWorkgroups(d,c),i.end(),e.queue.submit([o.finish()])}function S(){const o=e.createCommandEncoder();o.copyBufferToBuffer(t.dyeFieldOutBuf,0,t.dyeFieldBuf,0,t.dyeFieldBuf.size),e.queue.submit([o.finish()])}function b(){const o=e.createCommandEncoder();o.copyBufferToBuffer(t.velOutBuf,0,t.velBuf,0,t.velBuf.size),e.queue.submit([o.finish()])}function x(){const o=e.createCommandEncoder();o.copyBufferToBuffer(t.pressureOutBuf,0,t.pressureBuf,0,t.pressureBuf.size),e.queue.submit([o.finish()])}function O(){return e.createBindGroup({layout:r.renderPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t.gridSizeBuf}},{binding:1,resource:{buffer:t.canvasSizeBuf}},{binding:2,resource:{buffer:t.dyeFieldBuf}}]})}l()}async function rn(){const e=document.createElement("canvas");e.width=window.innerWidth,e.height=window.innerHeight,document.body.appendChild(e);const{device:n,context:t,format:a}=await W(e),r=512,u=Ae(n,r,e),s=he(n,a),l=en(n,s,u),f=new ve(e,n,u.mouseBuf);tn({device:n,context:t,buffers:u,bindGroups:l,pipelines:s,mouseHandler:f,gridSize:r})}rn();
