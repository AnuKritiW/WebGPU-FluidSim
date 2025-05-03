# simulation

## Setup instructions

1. Clone the repository
```
git clone git@github.com:AnuKritiW/WebGPU-FluidSim.git
cd WebGPU-FluidSim
```

2. Install dependencies
Make sure you have Node.js (v16 or later) installed.
Then install the required packages:
```
npm install
```

3. Run the development server
```
npm run dev
```
You should see output like:
```
  VITE v6.2.5  ready in 648 ms

  ➜  Local:   http://localhost:5173/WebGPU-FluidSim/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

4. Browser requirements
✅ This project uses WebGPU, which is not yet enabled by default in all browsers.
Use one of the following browsers:

* Chrome (latest)
* Chrome Canary (recommended)
* Safari Technology Preview

You may need to enable the chrome://flags/#enable-unsafe-webgpu flag in Chrome:
  1. Go to chrome://flags
  2. Search for “Unsafe WebGPU”
  3. Set it to Enabled
  4. Relaunch the browser