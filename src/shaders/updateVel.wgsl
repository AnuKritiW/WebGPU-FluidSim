/*
This shader injects forces into the velocity field using a 
Gaussian splatting approach that is anisotropically stretched 
in the direction of the mouse movement.
*/

// Stores vel values for each cell -- read and write access
@group(0) @binding(0) var<storage, read_write> vel : array<vec2<f32>>;

// Stores mouse position (xy) and velocity (zw)
@group(0) @binding(1) var<uniform> uMouse : vec4<f32>; // (posX, posY, velX, velY)

// Stores grid dimensions
@group(0) @binding(2) var<uniform> uGridSize : vec2<f32>;

// Stores the radius within which the force can spread
@group(0) @binding(3) var<uniform> uRad : f32;

// Stores the strength of the applied force
@group(0) @binding(4) var<uniform> uStrength : f32;

// In WebGPU, storage buffers use 1D indexing
// Helper function to convert (x,y) coords into a 1D array index
fn ID(x : f32, y : f32) -> u32 {
    return u32(x + y * uGridSize.x);
}

fn gaussianWeight(p : vec2<f32>, center : vec2<f32>, rad : f32, vel : vec2<f32>) -> f32 {
    var diff = p - center;
    
    // Anisotropic scaling: Stretch splat based on velocity direction
    let stretchFactor = max(1.0, length(vel) * 2.0);
    diff.x *= stretchFactor;

    let distSq = dot(diff, diff);
    let radSq = (rad * rad);
    let falloff = exp(-distSq / radSq); // exponential decay function

    // Threshold to prevent infinite spread
    // Forces only apply within a 4× radius region
    // Prevents unnecessary calculations on distant pixels
    return select(0.0, falloff, distSq < radSq * 4.0);
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    // convert workgroup index into a 2d pos
    let pos = vec2<f32>(global_id.xy);

    // check for grid out of bounds
    if (pos.x >= uGridSize.x || pos.y >= uGridSize.y) {
        return;
    }

    let index = ID(pos.x, pos.y);
    let mousePos = uMouse.xy * uGridSize;
    let mouseVel = uMouse.zw * uStrength;  

    let influence = gaussianWeight(pos, mousePos, uRad, mouseVel);

    // Apply force, with a velocity scaling factor for more fluidity
    // Higher vel increases influence, creating a natural swirling effect
    vel[index] += mouseVel * influence * (0.5 + 0.5 * length(mouseVel));
}
