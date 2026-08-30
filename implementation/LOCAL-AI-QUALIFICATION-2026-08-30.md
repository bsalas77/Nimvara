# Local-AI qualification — 2026-08-30

Run `cargo test --manifest-path app/src-tauri/Cargo.toml native_ai::tests::local_provider_answer_is_cited_and_workspace_stays_unchanged -- --exact --nocapture` to execute the targeted native regression test. It uses a loopback test provider, verifies that the answer includes a source citation, and verifies that the workspace bytes remain unchanged. The direct command passed on this Windows host; a Node wrapper is intentionally not shipped because this sandbox denies child-process spawning of `cargo.exe`.

This is a safety and contract check, not a quality benchmark. Real model retrieval precision, citation correctness across a corpus, prompt-injection coverage, latency, resource use, licensing, and hardware diversity remain release gates.
