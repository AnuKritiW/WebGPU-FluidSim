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

// Stores deltaTime (time between frames)
@group(0) @binding(5) var<uniform> uDeltaTime : f32;


// Gaussian function for splatting velocity influence
fn gaussianWeight(p : vec2<f32>, center : vec2<f32>, rad : f32) -> f32 {
    var diff = p - center;
    let distSq = dot(diff, diff);
    let invRadiusSquared = 1.0 / (rad * rad);
    return exp(-distSq * invRadiusSquared); // Exponential falloff
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {

    // Bounds check
    let x = global_id.x;
    let y = global_id.y;
    if (x >= u32(uGridSize.x) || y >= u32(uGridSize.y)) {
        return;
    }

    // Compute the 1D index for buffers
    let index = x + y * u32(uGridSize.x);

    // get grid cell position from the workgroup index
    let pos = vec2<f32>(f32(x), f32(y));

    let mousePosGrid = uMouse.xy * uGridSize.xy; // convert mouse position to grid space coordinates
    let mouseVel = uMouse.zw * uStrength; // amplify mouse velocity by strength for effect

    let dir = pos - mousePosGrid;

    let influence = gaussianWeight(pos, mousePosGrid, uRad);

    vel[index] += mouseVel * influence * uDeltaTime;
}
