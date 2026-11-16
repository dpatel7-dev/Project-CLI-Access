# Project CLI Access

One command for every project. Type `pca`, pick one with the arrow keys, press Enter.

```
  project cli access  ·  one command, every project                        v1.0.0

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
| [Tree of Thought](https://github.com/dpatel7-dev/Terminal-Of-Though-ToT-) | many AI models in one terminal garden | `tot` |
| [pigeon](https://github.com/dpatel7-dev/pigeon) | send files between your computer and phone | `pigeon` |

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
| ← → (or 1, 2, 3) | choose a project |
| Enter | open it — installs it first if it isn't on this computer yet |
| u | update the chosen project |
| U | update everything that's installed |
| x then x | uninstall the chosen project |
| q | quit |

When you leave a project you land back in the picker.

From the command line:

```sh
pca                      # the picker
pca tot                  # straight into Tree of Thought (installs it if needed)
pca pigeon send pic.png  # anything after the name goes to the project
pca list                 # what's installed, and which version
pca install all          # install every project
pca update               # update everything that's installed
pca remove gossip        # uninstall one project
pca uninstall            # remove pca itself (your projects stay)
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
