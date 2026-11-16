# Changelog

## 1.1.0
- pca keeps everything up to date by itself: when it starts it checks the website's /versions.json (at most once an hour) and quietly updates whatever is behind, itself included. Cards show ↻ while updating and ↑ when an update is waiting.
- `pca tot` (and the others) update that project before opening it.
- `pca auto on|off` and `pca auto daily` (a daily update even when pca isn't open: launchd on Mac, cron on Linux, a scheduled task on Windows).
- Pixel art no longer shows seams in macOS Terminal.

## 1.0.0

- First release: a picker for gossip, Tree of Thought and pigeon, each with its mascot.
- Enter opens a project, and installs it first if it isn't on this computer yet.
- `u` updates the chosen project, `U` updates everything installed, `x x` uninstalls one.
- `pca gossip`, `pca tot` and `pca pigeon` jump straight in; anything after the name is passed along.
- `pca list`, `pca install`, `pca update`, `pca remove`, `pca uninstall`.
- Installs come from the same website pca came from, so a self-hosted site keeps working.
