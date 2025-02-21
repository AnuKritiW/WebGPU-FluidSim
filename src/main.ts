import './style.css'
import typescriptLogo from './typescript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)

async function initWebGPU() {
  const statusElement = document.getElementById("gpu-status");

  if (!navigator.gpu) {
      console.error("WebGPU not supported on this browser.");
      if (statusElement) statusElement.innerText = "WebGPU not supported!";
      return;
  }

  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter?.requestDevice();

  if (!device) {
      console.error("Failed to get WebGPU device.");
      if (statusElement) statusElement.innerText = "Failed to initialize WebGPU!";
      return;
  }

  console.log("WebGPU initialized successfully!");
  if (statusElement) statusElement.innerText = "WebGPU is working!";
}

// Call WebGPU initialization
initWebGPU();