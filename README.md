# Project CLI Access

One command for every project. Type `pca`, pick one with the arrow keys, press Enter.

```
  project cli access  ·  one command, every project                        v1.2.0

  ╭──────────────────────╮  ╭──────────────────────╮  ╭──────────────────────╮
  │        Pebble        │  │        Rowan         │  │         Coo          │
  │ gossip               │  │ tree of thought      │  │ pigeon               │
  │ end-to-end encrypted │  │ many AI models, one  │  │ files between your   │
  │ ✓ v0.9.0 · gossip    │  │ not installed yet    │  │ ✓ v1.0.0 · pigeon    │
  ╰──────────────────────╯  ╰──────────────────────╯  ╰──────────────────────╯
```

| Project | What it is | Command |
| --- | --- | --- |
| [gossip](https://github.com/dpatel7-dev/gossip) | end-to-end encrypted terminal chat | `gossip` |
| [Tree of Thought](https://github.com/dpatel7-dev/Tree-Of-Thought) | many AI models in one terminal garden | `tot` |
| [pigeon](https://github.com/dpatel7-dev/pigeon) | your own locked drive; files fly between devices | `pigeon` |
| [tidy](https://github.com/dpatel7-dev/tidy) | an AI that tidies a folder, carefully (plans first, only moves, undo) | `tidy` |
| [den](https://github.com/dpatel7-dev/Den) | a cozy, beginner-friendly code editor that opens in your browser | `den` |
| [scout](https://github.com/dpatel7-dev/scout) | ask anything; it searches the web and explains, with sources | `scout` |
| [roomy](https://github.com/dpatel7-dev/roomy) | makes room on your disk, safely (to the Trash first, undo) | `roomy` |
| [hey](https://github.com/dpatel7-dev/hey) | say what you want to do, get the terminal command, explained | `hey` |
| [morph](https://github.com/dpatel7-dev/morph) | convert any file to any other, on your own computer (needs Python 3) | `morph` |

## Install

**Mac or Linux** — paste into Terminal:

```sh
curl -fsSL https://djp7.pythonanywhere.com/pca/install.sh | sh
```

**Windows** — paste into PowerShell:

```powershell
irm https://djp7.pythonanywhere.com/pca/install.ps1 | iex
```

Then open a new terminal window and type `pca`. You don't need anything else first: if Node.js isn't on your computer, the installer fetches a private copy that only pca uses.

## Use it

| Key | Does |
| --- | --- |
| ← → (or 1, 2, 3, 4) | choose a project |
| Enter | open it — installs it first if it isn't on this computer yet |
| u | update the chosen project |
| U | check for updates now and get them all |
| w | what's new in the chosen project |
| x then x | uninstall the chosen project |
| q | quit |

When you leave a project you land back in the picker.

From the command line:

```sh
pca                      # the picker
pca tot                  # straight into Tree of Thought (installs it if needed)
pca pigeon send pic.png  # anything after the name goes to the project
pca tidy ~/Downloads     # tidy a folder
pca den ~/my-site         # write code in a folder, in your browser
pca list                 # what's installed, and which version
pca install all          # install every project
pca update               # update everything that's installed
pca remove gossip        # uninstall one project
pca uninstall            # remove pca itself (your projects stay)
```

## Updates happen by themselves

Every time pca starts, it asks the website which versions are newest and quietly
updates whatever is behind, the projects and pca itself, while you look around
(a card shows ↻ while it updates). `pca tot` and friends update that project
before opening it. It checks at most once an hour, and if you're offline it just
opens what you have.

```sh
pca update          # check and update everything right now
pca auto off        # stop updating by itself (U in the picker still works)
pca auto daily      # also update once a day, even when pca isn't open
```

## Where installs come from

pca installs each project from the website it was installed from (`~/.pca/hub` remembers it), so if you host the site yourself, everything follows. The site lives in its own repository: [project-site](https://github.com/dpatel7-dev/project-site).

To use a different site for one run: `PCA_SITE=https://example.com pca`.

## Develop

```sh
git clone https://github.com/dpatel7-dev/Project-CLI-Access
cd Project-CLI-Access
node bin/pca.js
npm test
```

No dependencies. Node.js 18 or newer.

## License

MIT
