# InsureComp — Deployment Guide
## Publish to GitHub Pages (free, permanent URL)

Your live URL will be: **https://YOUR_GITHUB_USERNAME.github.io/insurecomp/**

---

## Step 1 — Extract the zip

Unzip `deploy-insurecomp.zip` anywhere on your computer.
You'll get a folder called `insurecomp/`.

---

## Step 2 — Create a GitHub repository

1. Go to https://github.com/new
2. Set **Repository name** to exactly: `insurecomp`
3. Keep it **Public**
4. Do **not** add a README or .gitignore (the zip already has one)
5. Click **Create repository**

---

## Step 3 — Enable GitHub Pages (Actions mode)

1. In your new repo, go to **Settings → Pages**
2. Under **Source**, choose **GitHub Actions**
3. Click **Save**

That's all — no branch to select, no folder to pick.

---

## Step 4 — Push the code

Open your terminal, `cd` into the `insurecomp/` folder, then run:

```bash
git init
git add .
git commit -m "Initial commit — InsureComp"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/insurecomp.git
git push -u origin main
```

> Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

---

## Step 5 — Watch it deploy

1. Go to your repo on GitHub
2. Click the **Actions** tab
3. You'll see a workflow called **Deploy to GitHub Pages** running
4. It takes about 60–90 seconds
5. When it shows a green ✅, your site is live

---

## Step 6 — Open your app

Visit: **https://YOUR_GITHUB_USERNAME.github.io/insurecomp/**

Bookmark it — this URL is permanent and free.

---

## Updating the app in future

Every time you push a change to `main`, GitHub Actions automatically rebuilds and redeploys:

```bash
# Make your changes to src/App.jsx, then:
git add .
git commit -m "Updated vendor logic"
git push
```

The site updates in ~60 seconds.

---

## Local development (optional)

To run the app locally before pushing:

```bash
npm install      # only needed once
npm run dev      # opens http://localhost:5173
```

---

## File structure reference

```
insurecomp/
├── index.html              ← HTML entry point
├── package.json            ← dependencies & scripts
├── vite.config.js          ← build config (base path set to /insurecomp/)
├── .gitignore
├── .github/
│   └── workflows/
│       └── deploy.yml      ← auto-deploy on every push to main
└── src/
    ├── main.jsx            ← React bootstrap
    └── App.jsx             ← your full insurance app
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| 404 on the URL | Wait 2 min and refresh; also check Actions tab for errors |
| Blank white page | Open browser DevTools (F12) → Console for errors |
| Wrong base URL | Edit `vite.config.js` line: `base: '/insurecomp/'` — must match your repo name exactly |
| Actions failing | Check Node version in `deploy.yml` matches your local `node --version` |
