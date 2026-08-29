# Linux VM validation — 2026-08-29

## Scope

Cross-platform qualification of Nimvara against disposable fixtures only. The user's Obsidian vault and personal files were not accessed or modified.

## Host and guest evidence

- Host: Windows workstation with Oracle VirtualBox installed.
- Guest: VirtualBox VM `Ububtu1`, Ubuntu 25.04 (Plucky Puffin), 4096 MB RAM.
- VM state: running; Ubuntu desktop reached through the VirtualBox console.
- Network mode: NAT.
- VirtualBox forwarding rules: host TCP `2222` → guest TCP `22`; host TCP `8080` → guest TCP `8080`.
- The forwarded HTTP port returned an unrelated `QuellOps` page, not Nimvara.
- Guest Additions did not report a guest IP address or logged-in users.

## SSH result

Attempted read-only connection as the user-provided account `Barry` using the host OpenSSH client and `127.0.0.1:2222`. The connection reached the forwarding layer but failed during banner exchange with `kex_exchange_identification: read: Unknown error` (exit 255). Ubuntu Settings → Sharing contained media sharing only; no Remote Login control was present. A graphical check was performed in the Ubuntu desktop while the VM was running; no OpenSSH/Remote Login control was available to enable. This indicates that `sshd` is not installed, running, or reachable in the guest. VirtualBox forwarding alone cannot enable the guest service.

## Gate status

**Blocked — guest shell access is required before Linux-side automated qualification can run.** No Linux test pass is claimed. The Windows test suite remains the authoritative validated result (49 passed, 0 failed).

## Minimal unblock

Inside Ubuntu, an administrator must install and start OpenSSH Server, then provide either the password for `Barry` for a one-time test or an authorized public key. Expected commands are:

```bash
sudo apt update
sudo apt install -y openssh-server
sudo systemctl enable --now ssh
sudo systemctl status --no-pager ssh
```

After that, Nimvara can run the disposable Linux qualification through `ssh -p 2222 Barry@127.0.0.1`. Do not expose SSH beyond the local NAT forward unless separately approved.

## Remaining Linux gates

1. Establish authenticated SSH access.
2. Copy only disposable Nimvara fixtures (or clone the project) into the guest.
3. Install the documented runtime/toolchain dependencies.
4. Run sync, integrity, ingestion, and packaging checks; capture logs and resource observations.
5. Test the Linux distribution artifact on a clean guest before release.
