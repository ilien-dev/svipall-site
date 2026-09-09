---
title: Install
summary: Every channel, which platforms carry which build, how to wire it into an agent, and the failures that actually happen.
group: Start here
order: 10
source: docs/install.md
---

The source page for this one is written to be executed rather than read. Hand it to
any coding agent and it has everything it needs:

```text
Install and configure Svipall by following the instructions here:
https://raw.githubusercontent.com/ilien-dev/svipall/main/docs/install.md
```

A person can follow it too. Every command is exact, and none of them needs an
administrator.

> **Never with `sudo`**
> Everything installs into a directory you own. A step that seems to need root
> means something went wrong; stop there rather than escalating.

## Is it already there?

```bash
svipall --version
```

A JSON object means yes. `command not found` means no.

## Pick a channel

| Situation | Command |
|---|---|
| macOS or Linux | `curl -fsSL https://raw.githubusercontent.com/ilien-dev/svipall/main/install.sh \| sh` |
| Windows | `irm https://raw.githubusercontent.com/ilien-dev/svipall/main/install.ps1 \| iex` |
| Debian / Ubuntu | download `svipall_<version>_amd64.deb` from the release, then `sudo dpkg -i` |
| Fedora / RHEL | download `svipall-<version>.x86_64.rpm` from the release, then `sudo rpm -i` |
| Containers | `docker pull ghcr.io/ilien-dev/svipall:latest`, or the version tag while the newest release is a pre-release |
| Has Homebrew | `brew install ilien-dev/svipall/svipall` |
| Has Scoop | `scoop bucket add svipall https://github.com/ilien-dev/scoop-svipall` then `scoop install svipall` |
| Node is already there | `npx --yes svipall doctor` — downloads the same release build on first use |
| Rust toolchain is there | `cargo install svipall` — builds from source, and so carries no captcha models |

> **winget and the AUR are not published**
> The manifests exist and are rendered from each release, but each needs a one-time
> step outside the repository that has not been taken. Asking for either gets you
> `No package found matching input criteria`.

The `install.sh` / `install.ps1` scripts put both binaries in `~/.local/bin` (POSIX)
or `%LOCALAPPDATA%\Programs\svipall` (Windows), add that directory to the **user's**
PATH, verify the download against the published `sha256sums.txt`, and print what
they touched. `--uninstall` reverses it.

The managed browser download is about **190 MB**. It is provisioned automatically
when needed; `--no-browser` / `-NoBrowser` disables that.

## Which platforms have builds

| Platform | Binary | Browser tiers | Models | Everything works via |
|---|---|---|---|---|
| Linux x86-64 | yes | yes | **no** | the container |
| Linux arm64 | yes | **no** — point `browser_path` at your own Chromium, or accept the http tier | **no** | the container |
| macOS Intel | yes | yes | **no** | the container (`linux/amd64` runs under Docker Desktop) |
| macOS Apple silicon | yes | yes | yes | the binary |
| Windows x86-64 | yes | yes (Edge already counts) | yes | the binary |
| Windows arm64 | no | — | — | the x64 build under emulation, or the container |
| anything else | no | — | — | the container, or build from source |

### Why the Linux binaries carry no models

The ONNX Runtime builds that `ort` downloads reference glibc 2.38 and GCC 13's
libstdc++, so a binary using them starts only on a distribution as new as Ubuntu
24.04 — not on Debian 12, Ubuntu 22.04, RHEL 9 or Amazon Linux 2023.

Given a binary that starts everywhere or one that answers image captchas on the
newest distributions only, the release ships the first. Image challenges go to the
human dashboard instead, and `svipall doctor` says `no_models`.

The **container image has everything, on both architectures**, because a container
carries its own glibc. On arm64 its browser is Debian's own Chromium rather than
Chrome for Testing, which publishes no linux-arm64 build; `svipall doctor` reports
`chromium` instead of `managed` — one step down on fingerprint quality, and still a
real browser.

## Building from source

Only if you asked for it, or no build exists for your platform. It needs a Rust
toolchain plus `cmake`, `nasm`, `perl` and `llvm` for BoringSSL, and it takes a
while.

```bash
git clone https://github.com/ilien-dev/svipall
cd svipall
cargo build --release
```

Three ways a source build differs from a release one:

- On **Windows**, set a short `CARGO_TARGET_DIR` first (e.g. `C:\t`). BoringSSL's
  build paths run into `MAX_PATH` and the failure is an unhelpful cmake error.
- A plain `cargo build --release` in this repo picks up `target-cpu=native` from
  `.cargo/config.toml`. That binary is for that machine only, and copied elsewhere
  it can die with an illegal instruction. Release artefacts use `--profile dist`
  and an explicit baseline.
- A source build carries **no captcha models** unless `tools/models/export.py` was
  run first, which needs Python, torch and onnx.

`cargo install svipall` is the same source build with the clone done for you, and it
inherits that last point with no way around it: the weights are exported at release
time and are not inside the published crate.

Every crate of the workspace is published on crates.io except the benchmark
harness. `svipall-extract` is the one worth depending on by itself, under
`MIT OR Apache-2.0` rather than the workspace's AGPL.

No BoringSSL toolchain at all? `cargo build --release --no-default-features` drops
to reqwest and loses the browser-grade TLS fingerprint. `svipall doctor` reports
`no_impersonation`.

## Check it

```bash
svipall doctor
```

One JSON object. `ok: true` means ready. Otherwise every entry in `problems[]`
carries a `message` and a `fix`:

| `code` | What it means | What to do |
|---|---|---|
| `no_browser` | Browser tiers need a compatible browser | Normal startup provisions one automatically on supported platforms; `svipall browser install` does it now |
| `no_models` | Image captchas go to the human dashboard instead of being answered | Use a release build |
| `models_not_readable` | The build carries weights but no `onnx-*` feature to read them, so they answer nothing | Use a release build |
| `no_impersonation` | Built without BoringSSL; the http tier is recognisable in the first packet | Use a release build |
| `stale_browser` | The browser announces a Chrome old enough to be a signal | `svipall browser update` |
| `self_defending_browser` | Brave/Vivaldi/Opera contradict the identity every other layer states | `svipall browser install` |
| `dashboard_port_busy` | Usually a `svipall-mcp` already running, which is fine | Nothing, or change `dashboard_port` |
| `home_not_writable` | Nothing is remembered between runs | Fix the directory's permissions, or set `SVIPALL_HOME` |

## Wire it into the agent

### Claude Code — the plugin does all of it

```text
/plugin marketplace add ilien-dev/svipall
/plugin install svipall@svipall
/svipall:setup
```

The plugin registers the MCP server and ships the skills. `/svipall:setup` also
offers to make Svipall the way this user reaches the web everywhere, and
`/svipall:uninstall` reverses it.

### Claude Code — by hand

```bash
claude mcp add svipall -- svipall-mcp
```

If `svipall-mcp` is not on the PATH of whatever launched Claude Code, use the
absolute path: `claude mcp add -s user svipall -- /absolute/path/to/svipall-mcp`.

The npm route installs nothing on the PATH, so there it is npx that has to find the
binary:

```bash
claude mcp add svipall -- npx --yes --package=svipall svipall-mcp
```

`--package` is not optional. The package is `svipall` and the binary is
`svipall-mcp`; npx given a bare `svipall-mcp` looks for a **package** by that name,
which nobody publishes.

### Claude Desktop, Cursor, and any other MCP client

```json
{
  "mcpServers": {
    "svipall": {
      "command": "svipall-mcp"
    }
  }
}
```

Use an absolute path for `command` if the client does not inherit your shell's PATH.
GUI apps on macOS usually do not.

### Codex, opencode, and agents that prefer a shell

Point them at the CLI instead. It is the same server for a fraction of the tokens:
copy `SKILL.md` from the release archive into wherever that agent keeps its skills —
`~/.codex/skills/svipall/SKILL.md`, `.opencode/skills/`, and so on. The whole
surface is `svipall <command>`.

### A container instead of a binary

```bash
claude mcp add svipall -- docker run -i --rm -v svipall-home:/data ghcr.io/ilien-dev/svipall:latest
```

`-i` keeps stdin open for MCP, and `-v svipall-home:/data` is what makes it remember
anything. Two moving tags, both built for amd64 and arm64: `latest` (browser and
models) and `slim` (the http tier only). A pre-release moves neither, so pull the
version tag instead — `ghcr.io/ilien-dev/svipall:1.0.0-rc`, `:1.0.0-rc-slim`.

## Optional: make it the default way to reach the web

In Claude Code, `/svipall:setup` does this for you. By hand, add to
`~/.claude/CLAUDE.md` or your agent's equivalent memory file:

```text
<!-- BEGIN SVIPALL -->
@svipall/SVIPALL.md
<!-- END SVIPALL -->
```

and put the routing rules at `~/.claude/svipall/SVIPALL.md`. Keep the markers:
they are what makes it removable.

There is also a strict mode, off by default, in which Claude Code's own `WebFetch`
and `WebSearch` are declined with a pointer to the Svipall tool that does the same
job. Turn it on by creating an empty `~/.svipall/claude_strict`; delete the file to
turn it off, no restart.

## Known failures

| Symptom | Cause | Fix |
|---|---|---|
| macOS: *"cannot be opened because the developer cannot be verified"* | The build is signed ad-hoc, not notarised — there is no Apple Developer ID for this project — and a browser-downloaded file is quarantined | `xattr -d com.apple.quarantine /path/to/svipall`. `install.sh` and Homebrew do not hit this |
| Windows: SmartScreen warns about the installer | Unsigned, for the same reason | Check the sha256 against `sha256sums.txt` on the release page, then allow it |
| Windows source build: cmake fails with `MSB4184` | BoringSSL's paths exceed `MAX_PATH` | Set `CARGO_TARGET_DIR=C:\t` and rebuild |
| `svipall: command not found` right after installing | The PATH change only applies to new shells | Open a new terminal, or use the absolute path the installer printed |
| Every page comes back blocked | No browser, so only the http tier ran | `svipall doctor`, then `svipall browser install` |
| Captchas always go to the dashboard | The build carries no models | `svipall doctor`; use a release build |
| The MCP tools are missing while `svipall doctor` works | The binary is fine, the registration is not | Re-run the wiring step with an absolute path, and restart the client |
| `docker run -p 8787:8787` and the dashboard does not load | Loopback inside a container is the container | The entrypoint writes a `/data/config.toml` binding `0.0.0.0` on first start; with your own config, set `dashboard_bind` yourself |

## Removing it

```bash
sh install.sh --uninstall          # or: install.ps1 -Uninstall
brew uninstall svipall
scoop uninstall svipall
```

That leaves `~/.svipall` alone on purpose: profiles, cookies, cache, learned tiers
and the downloaded browser. Delete it by hand if you mean to, because none of it
comes back.

In Claude Code, `/svipall:uninstall` removes the memory block, strict mode and the
MCP entry, and tells you what it did.
