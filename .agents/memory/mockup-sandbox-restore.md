---
name: Mockup Sandbox Restoration
description: How to restore the mockup-sandbox artifact when its source files go missing and it's not registered in the workflow system.
---

# Mockup Sandbox Restoration

## The problem
`artifacts/mockup-sandbox/` directory exists (from git history) but:
- Source files (`src/`, `vite.config.ts`, etc.) are missing from disk
- Artifact is not registered (not returned by `listArtifacts()`)
- Workflow restart fails with "run command doesn't exist in config"

## Fix: restore files from git

Use `git show COMMIT:path` (colon syntax) — NOT `git show COMMIT -- path` (dash-dash redirected):

```bash
git show 316333b:artifacts/mockup-sandbox/package.json > artifacts/mockup-sandbox/package.json
```

The dash-dash syntax includes the commit header in stdout, corrupting the file.

## Fix: re-register the artifact

After restoring `.replit-artifact/artifact.toml` to disk:
1. Copy it to a temp edit file
2. Call `verifyAndReplaceArtifactToml({ tempFilePath, artifactTomlPath })`
3. This re-registers the artifact and recreates the workflow config
4. Then `restartWorkflow` succeeds

## Fix: tsconfig.base.json missing

The mockup-sandbox `tsconfig.json` extends `../../tsconfig.base.json` which may not exist.
Replace with a standalone tsconfig inlining the necessary options (see current tsconfig.json).

**Why:** The workspace root tsconfig.base.json can go missing after environment resets. The mockup-sandbox is a leaf package and doesn't need the composite setup from the base.
