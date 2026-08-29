# Contributing

Project Nimvara is not yet accepting production claims. Contributions should preserve ordinary Markdown, atomic conflict-aware saves, user-owned backups, local-first operation, and explicit review before AI changes.

Run the zero-dependency core suite:

```powershell
cd app
node tests\run-all.mjs
```

Every behavior change needs a regression test. Never use real private vault content in issues or fixtures. Security findings belong in the private reporting channel described in `SECURITY.md`.
