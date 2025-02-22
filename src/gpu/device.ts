export async function initWebGPU(canvas: HTMLCanvasElement) {
  const statusElement = document.getElementById("gpu-status");

  if (!navigator.gpu) {
    console.error("WebGPU not supported on this browser.");
    if (statusElement) statusElement.innerText = "WebGPU not supported!";
    throw new Error("WebGPU not supported.");
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    console.error("No appropriate GPUAdapter found.");
    if (statusElement) statusElement.innerText = "No compatible GPU found!";
    throw new Error("No appropriate GPUAdapter found.");
  }
  
  const device = await adapter.requestDevice();
  if (!device) {
    console.error("Failed to get WebGPU device.");
    if (statusElement) statusElement.innerText = "Failed to initialize WebGPU!";
    throw new Error("Failed to get WebGPU device.");
  }

  console.log("WebGPU initialized successfully!");
  if (statusElement) statusElement.innerText = "WebGPU is working!";

  const context = canvas.getContext("webgpu") as GPUCanvasContext;
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device: device, 
    format: canvasFormat,
  });

  return { device: device, 
           context: context, 
           format: canvasFormat };
}
