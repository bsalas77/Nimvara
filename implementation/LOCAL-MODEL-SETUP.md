# Local model setup engineering gate

Status: safe activation foundation complete; production catalog and guided download remain gated.

## What is implemented and tested

- Detects physical memory and logical CPU count on Windows, Linux, and macOS.
- Gives a conservative starting model-size band while explicitly reporting GPU, VRAM,
  acceleration, thermals, and measured speed as unknown.
- Detects only reviewed loopback services: Ollama, LM Studio, and llama.cpp.
- Requires a reviewed manifest containing model ID, name, license, source URL, exact
  byte length, SHA-256, and minimum memory.
- Streams model hashing rather than loading the model into memory.
- Imports only a successfully verified model into the OS application-data model area.
- Copies to a unique partial file, flushes and syncs it, re-verifies it, then atomically
  renames it into a content-addressed filename.
- Leaves the selected source model unchanged and cleans partial files after failure.
- Rejects model IDs capable of path traversal.

The test model is synthetic. No real model download, license approval, inference-speed
benchmark, GPU claim, or production model recommendation is represented by that test.

## Intentionally blocked

Nimvara does not silently download or activate a model. A production catalog requires
an owner-reviewed redistributable model license, immutable download URL, published
SHA-256 and size, and testing on the supported hardware matrix. A resumable downloader
must use a fixed catalog, HTTPS, size limits, a quarantine area, and the same verification
and activation path now implemented.

Until that catalog is approved, users can run a compatible local service themselves.
The application keeps local traffic on loopback.

## Hardware evidence still required

- Windows x64 systems at 8, 16, and 32 GiB RAM.
- Intel, AMD, NVIDIA, and CPU-only configurations.
- Apple Silicon systems supported by the macOS release.
- Linux Wayland and X11 configurations.
- Measured load time, tokens/second, peak resident memory, cancellation, thermal behavior,
  and failure recovery for every recommended model.

