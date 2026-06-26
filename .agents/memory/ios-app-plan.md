---
name: iOS App Plan
description: Plan for building a native iOS app version of noahpac.com using Expo, saved for a future session.
---

# iOS App Plan — noahpac Clinical Reference Tools

## Goal
Build a native iOS app version of the clinical reference suite using Expo (React Native), running alongside the existing static web tools in Replit.

## Approach: WebView Hybrid (recommended first pass)

Each tool (calculators, labs, abx, ddx, etc.) is already a self-contained HTML/JS/CSS page. Rather than rebuilding all 19+ tools in React Native from scratch, wrap them in `WebView` components inside a native shell. This gives:
- Native navigation, tab bar, app icon, splash screen
- Full fidelity of existing tools (no logic rewrite)
- Offline support via cached HTML files bundled in the app
- Path to incrementally replace WebViews with native components later

## Steps

### Step 1: Restore workspace structure
- Recreate `pnpm-workspace.yaml` pointing to `artifacts/*`
- The file is already in `.gitignore` — will not be committed
- No impact on nginx hosting or git repo

### Step 2: Scaffold Expo artifact
- Use the `artifacts` skill to create `artifacts/ios/`
- Use the `expo` skill for setup conventions
- Package name: `com.noahpac.clinical` (or similar)
- Configure workflow for Expo dev server

### Step 3: Build native shell
- Bottom tab navigator: Home, Calculators, Labs/DDx, Abx, More
- Each tab loads the corresponding HTML tool in a WebView
- URLs point to bundled local files (not remote) for offline use
- Shared header with app branding

### Step 4: Polish
- App icon (already have 192/512px PNGs in root)
- Splash screen
- Dark mode support (tools already have dark mode via shared.css)
- iOS-safe-area handling

### Step 5: Distribution
- Expo Go for testing
- EAS Build for TestFlight / App Store submission (requires Apple Developer account)

## Key files to know
- Root tool pages: `calculators/index.html`, `abx/index.html`, `labs/index.html`, `ddx/index.html`, `sti/index.html`, `tccc/index.html`, `vaccines/index.html`
- Icons: `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` at root
- Branding colors: from `shared.css` (dark navy + white, dark mode supported)

## What does NOT need to change
- All HTML/JS/CSS tool files at workspace root — untouched
- `.gitignore` — already set correctly
- nginx/noahpac.com hosting — completely unaffected

## Open questions for Noah
- Apple Developer account enrolled? (required for TestFlight/App Store)
- App name for the store: "Noah PA-C Clinical Tools"? Something else?
- Should the app require login / be public?
- Priority order for which tools to include first?
