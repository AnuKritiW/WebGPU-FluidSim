# simulation

To see the simulation, visit https://anukritiw.github.io/WebGPU-FluidSim/

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
