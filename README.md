# MPLADS AI Integrity & Monitoring System

## GitHub Pages quick deployment

This repository is configured so that pushing `main`/`master` deploys the React application to GitHub Pages without requiring a running Express server.

### Important

GitHub Pages is a static host. The GitHub Pages build therefore uses **static demo mode** for authentication and application data. This is suitable for demonstration/evaluation only. It is **not a secure production authentication system** and must not be used for confidential MPLADS data.

### Demo login

- Administrator: `ADMIN001` / `Admin@123`
- MP: `MP001` / `MP@123`
- Agency: `AGENCY001` / `Agency@123`

### Local development

```bash
npm install
npm run dev
```

The local full-stack development server is still available through `server.ts`.

### GitHub Pages

The workflow sets:

```text
VITE_STATIC_MODE=true
```

The frontend automatically detects `github.io` hosts and uses the browser-side demo store instead of calling `/api/*`.

### Production architecture

For a secure production deployment, run the backend separately and set `VITE_API_BASE_URL` to the backend HTTPS origin. Do not enable static demo mode for private/production data.
