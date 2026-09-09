# Deployment

## GitHub Pages — static demo

1. Push this project to GitHub.
2. Use the repository's Pages deployment workflow.
3. The workflow builds the client with `VITE_STATIC_MODE=true`.
4. Open the generated GitHub Pages URL.
5. Use one of the demo logins in `README.md`.

No Express backend is required for the GitHub Pages demo build.

### What this mode means

GitHub Pages cannot execute Node/Express code. The static demo therefore uses the browser-side demo store for login and application data. This makes the site self-contained for demonstrations, but it is not a secure production authorization boundary because the shipped JavaScript and demo data are public.

## Full-stack deployment

For real authentication, private data, server-side authorization, AI secrets, and production persistence, deploy the Express backend on a Node-capable host and set:

```text
VITE_STATIC_MODE=false
VITE_API_BASE_URL=https://YOUR-BACKEND-DOMAIN
```

Keep server-only values such as `JWT_SECRET` and `GEMINI_API_KEY` out of the frontend build.
