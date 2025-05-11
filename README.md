# WebGPU 2D Fluid Simulation

See the **_simulation_** [**here**](https://anukritiw.github.io/WebGPU-FluidSim/)

See the **_demo_** [**here**](https://youtu.be/MOoxdB8uJxw)

![Demo GIF](./assets/demo.gif)

## Setup instructions

1. Clone the repository
```bash
git clone git@github.com:AnuKritiW/WebGPU-FluidSim.git
cd WebGPU-FluidSim
```

2. Install dependencies

Make sure you have Node.js (v16 or later) installed.
Then install the required packages:
```bash
npm install
```

1. Run the development server
```bash
npm run dev
```
You should see output like:
```bash
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

You may need to enable the `chrome://flags/#enable-unsafe-webgpu` flag in Chrome:
  1. Go to `chrome://flags`
  2. Search for “Unsafe WebGPU”
  3. Set it to Enabled
  4. Relaunch the browser

## Deploying to GitHub Pages

If you’ve cloned this repo and want to deploy it under **your own GitHub Pages link**, follow these steps:

1. Install dependencies

```bash
npm install
```

2. Update `package.json`

In `package.json`, update the homepage field to point to your GitHub Pages URL:
```json
"homepage": "https://<your-github-username>.github.io/<your-repo-name>/"
```
Replace `<your-github-username>` and `<your-repo-name>` with your GitHub username and repo name.

This ensures asset paths are correct when hosted.

3. Update `vite.config.js`

In `vite.config.js`, set the base option to match your repo name:
```js
export default defineConfig({
  base: '/<your-repo-name>/', // e.g. '/my-vite-app/'
  // other config
});
```

4. Build the project

```bash
npm run build
```
This generates the production build inside the `dist/` folder.

1. Deploy to GitHub Pages

Make sure you’re on the branch you want to deploy from (e.g., `main`), then run:
```bash
npm run deploy
```

This command pushes the `dist/` folder to a `gh-pages` branch in your repository.

After a few minutes, your site will be live at:
```php
https://<your-github-username>.github.io/<your-repo-name>/
```
6. GitHub Pages settings (optional check)

Make sure your repo’s GitHub Pages settings are set to deploy from the `gh-pages` branch.
Go to:
```
Repo → Settings → Pages → Source → gh-pages branch
```

# References:
```
Dobryakov, P., 2024. WebGL-Fluid-Simulation. Github. Available from: https://github.com/PavelDoGreat/WebGL-Fluid-Simulation [Accessed 20 February 2025].

Fedkiw, R., Stam, J. and Jensen, H.W., 2001. Visual simulation of smoke. In: Fiume, E., ed. Proceedings of the 28th annual conference on Computer graphics and interactive techniques (SIGGRAPH 2001), Los Angeles, USA, 12–17 August 2001. New York: Association for Computing Machinery (ACM), 15–22. Available from: https://doi.org/10.1145/383259.383260 [Accessed 5 May 2025].

GeeksforGeeks, 2021. Difference between TypeScript and JavaScript. Noida: GeeksforGeeks. Available from: https://www.geeksforgeeks.org/difference-between-typescript-and-javascript/ [Accessed 5 May 2025].

Harris, M.J., 2004. Fast fluid dynamics simulation on the GPU. In: Fernando, R., ed. GPU Gems. Boston: Addison-Wesley. Available from: https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-38-fast-fluid-dynamics-simulation-gpu [Accessed 20 February 2025].

Jones, B. and Beaufort, F., 2025. Your first WebGPU app. Google Developers. Available from: https://codelabs.developers.google.com/your-first-webgpu-app [Accessed 20 February 2025].

Mozilla, 2024. WebGPU API. Mozilla. Available from: https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API [Accessed 5 May 2025].

Kishimisu, 2023. WebGPU-Fluid-Simulation. Github. Available from: https://github.com/kishimisu/WebGPU-Fluid-Simulation [Accessed 1 March 2025].

Stam, J., 1999. Stable fluids. In: Rockwood, A., ed. Proceedings of the 26th annual conference on Computer graphics and interactive techniques (SIGGRAPH 1999), Los Angeles, USA, 8-13 August 1999. New York: ACM Press. pp.121-128. Available from: https://doi.org/10.1145/311535.311548 [Accessed 20 February 2025].

Stam, J., 2003. Real-time fluid dynamics for games. In: Müller, M., ed. Proceedings of the Game Developer Conference (GDC 2003), San Jose, USA, 4-8 March 2003. San Jose: Game Developers Conference. Available from: https://www.dgp.toronto.edu/people/stam/reality/Research/pdf/GDC03.pdf [Accessed 20 February 2025]. 

WebGPU Fundamentals, (no date). WebGPU Fundamentals. Available from: https://webgpufundamentals.org/ [Accessed 21 February 2025].

Wong, J., 2016. Fluid Simulation (with WebGL demo). Available from: https://jamie-wong.com/2016/08/05/webgl-fluid-simulation/ [Accessed 1 March 2025].

```