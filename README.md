# Daily Focus

A small to-do list that helps you choose and finish **three important tasks** each day. It runs entirely in the browser — no build step, backend, or API keys.

## Open the app locally

1. Download or clone this repository.
2. Open `index.html` in a modern browser (Chrome, Firefox, Safari, or Edge).
3. Add a task, pin up to three unfinished items as today’s priorities, and toggle dark mode from the header.

Your tasks, priorities, and theme are stored in `localStorage` on this device.

## Publish on GitHub Pages

1. Create a GitHub repository and push these files to the default branch (`main` or `master`).
2. On GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose the default branch and the `/ (root)` folder, then save.
5. After a minute or two, GitHub will show the site URL (typically `https://<username>.github.io/<repository>/`).

Because this project is static HTML, CSS, and JavaScript at the repo root, Pages can serve it with no extra configuration.

## What’s included

| File | Role |
| --- | --- |
| `index.html` | Page structure, form, filters, and landmarks |
| `styles.css` | Layout, navy/green theme, light/dark colors, focus styles |
| `script.js` | Tasks, priorities, filters, theme, and `localStorage` |
