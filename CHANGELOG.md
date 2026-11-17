# Changelog

## 1.3.0
- den joins the family: a cozy code editor that opens in your browser, with Ember the fox explaining things (her card is the orange one). Enter installs and opens it in the folder you're in.
- Cards wrap into rows when the window is narrow, and the mascots only show when there's room, so every card is always on screen.

## 1.2.1
- Installing and updating fall back to GitHub when the website doesn't answer (blocked at school, offline, or not updated yet: that was the 404 when installing tidy). The installer is downloaded in full before it runs.

## 1.2.0
- tidy joins the family: an AI that tidies a folder for you (Hazel the squirrel's card). Enter installs and opens it.
- w shows what's new in the chosen project.

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
