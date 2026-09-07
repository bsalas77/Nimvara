# Nimvara project guidance

## Persistent subagent routing

Use at most one helper at a time, and only when delegation is likely to improve quality or efficiency. Complete small tasks directly.

- Use `nimvara_architect` for architecture, security, authentication, difficult debugging, and final review. It uses GPT-6 Astra with high reasoning.
- Use `nimvara_implementer` for routine implementation and ordinary debugging. It uses GPT-5.6 Terra with medium reasoning.
- Use `nimvara_maintainer` for small, clearly defined edits and mechanical documentation work. It uses GPT-5.6 Luna with medium reasoning.

The main conversation remains on its user-selected model. Delegation selects a helper model only for the bounded delegated task. Do not purchase credits, enable API billing, or create persistent services to route work.

Keep the app local-first, Markdown-authoritative, safe for user workspaces, and Windows/Linux-first. Treat signing, publishing, account administration, and destructive actions as separate approval-sensitive operations.
