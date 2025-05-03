export class MouseHandler {
  pos: [number, number] = [0, 0]; // stores normalized mouse position
  vel: [number, number] = [0, 0]; // stores mouse velocity
  isMouseDown: boolean = false;

  constructor(canvas: HTMLCanvasElement, device: GPUDevice, mouseBuffer: GPUBuffer) {
    let lastPos: [number, number] = [0, 0]; // local var storing previous pos to be able to calculate vel later

    canvas.addEventListener("mousedown", (event) => {
      this.isMouseDown = true;

      // update lastPost to current position
      const rect = canvas.getBoundingClientRect();
      lastPos = [
        (event.clientX - rect.left) / rect.width,
        (event.clientY - rect.top) / rect.height
      ];
    });

    canvas.addEventListener("mouseup", () => {
      this.isMouseDown = false;

      this.vel = [0, 0];
      this.updateGPUBuffer(device, mouseBuffer);
    });

    canvas.addEventListener("mousemove", (event) => {
      if (!this.isMouseDown) return;

      const rect = canvas.getBoundingClientRect();
      const newPos: [number, number] = [
        // normalization
        (event.clientX - rect.left) / rect.width,
        (event.clientY - rect.top) / rect.height,
      ];

      const numSteps = 20; // number of interpolation steps
      for (let i = 1; i <= numSteps; i++) {
        const t = i / (numSteps + 1);
        const interpPos: [number, number] = [
          lastPos[0] + (newPos[0] - lastPos[0]) * t,
          lastPos[1] + (newPos[1] - lastPos[1]) * t
        ];

        const interpVel: [number, number] = [
          interpPos[0] - lastPos[0],
          interpPos[1] - lastPos[1]
        ];

        const boostedVel: [number, number] = [
          interpVel[0] * 5.0, // same speed factor you already used
          interpVel[1] * 5.0
        ];

        const data = new Float32Array([
          interpPos[0], interpPos[1], // posX, posY
          boostedVel[0], boostedVel[1] // velX, velY
        ]);

        device.queue.writeBuffer(mouseBuffer, 0, data);
      }

      this.vel = [newPos[0] - lastPos[0], newPos[1] - lastPos[1]];
      this.pos = newPos;
      lastPos = newPos; // update last position for the next frame

      // DEBUG
      // console.log(`Mouse Pos: (${this.pos[0].toFixed(3)}, ${this.pos[1].toFixed(3)})`);
      // console.log(`Mouse Vel: (${this.vel[0].toFixed(3)}, ${this.vel[1].toFixed(3)})`);

      this.updateGPUBuffer(device, mouseBuffer);
    });
  }

  updateGPUBuffer(device: GPUDevice, buffer: GPUBuffer) {
    const speedFactor = 5.0;
    const boostedVel: [number, number] = [
      this.vel[0] * speedFactor,
      this.vel[1] * speedFactor
    ];

    const data = new Float32Array([
      this.pos[0], this.pos[1], // posX, posY
      boostedVel[0], boostedVel[1]  // velX, velY
    ]);

    // write to GPU buffer
    device.queue.writeBuffer(buffer, 0, data);
  }
}
