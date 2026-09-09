# GitHub Pages deployment

This repository supports a **static demo deployment** on GitHub Pages.

## What works on GitHub Pages

- Login using the demo accounts listed in the application documentation.
- Role-based client-side demo views.
- Project browsing and filtering.
- Dashboard calculations from bundled demo data.
- Local browser persistence for demo changes.
- GIS and other frontend features that do not require a server secret.

## Important limitation

GitHub Pages is a static host. It cannot run the Express backend, enforce server-side authentication, or safely protect private production data.

Therefore this GitHub Pages build uses **static demo authentication/data mode**. It is intended for presentations, evaluation, and UI demonstrations only—not real confidential MPLADS data.

For a secure production deployment, run the Express backend separately and set `VITE_API_BASE_URL` to its HTTPS origin, then do not enable `VITE_STATIC_MODE`.
