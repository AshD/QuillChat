# QuillChat
AI Chat Client

## GitHub Pages

This project is configured to deploy to GitHub Pages using SvelteKit's static adapter. The
workflow at `.github/workflows/deploy.yml` builds the app with `BASE_PATH` set to the
repository name so asset paths resolve correctly when served from a subdirectory.
