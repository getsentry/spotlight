# Continuous Profiling Test Fixtures

This directory contains test fixtures for continuous profiling (Sample Format V2).

## Files

| File | Description |
|------|-------------|
| `profile_chunk_1.txt` | First profile chunk - app launch & Sentry setup samples |
| `profile_chunk_2.txt` | Second profile chunk - view loading & network samples |
| `transaction.txt` | Transaction linked to profiles via `contexts.profile.profiler_id` |

## Usage

Send all fixtures to the sidecar for manual testing:

```bash
# From the spotlight package directory
cd packages/spotlight

# Send all continuous profiling fixtures
node _fixtures/send_to_sidecar.cjs _fixtures/continuous_profiling/
```

Or send individual files:

```bash
node _fixtures/send_to_sidecar.cjs _fixtures/continuous_profiling/profile_chunk_1.txt
node _fixtures/send_to_sidecar.cjs _fixtures/continuous_profiling/profile_chunk_2.txt
node _fixtures/send_to_sidecar.cjs _fixtures/continuous_profiling/transaction.txt
```

## Linking

The profile chunks and transaction are linked via:

| Field | Value |
|-------|-------|
| `profiler_id` | `71bba98d90b545c39f2ae73f702d7ef4` |
| `trace_id` | `f1e2d3c4b5a6978012345678901234ab` |
| `thread.id` | `259` (main thread) |

## Profile Chunk Contents

### Chunk 1 - App Launch (timestamps ~1724777211.50 - 1724777211.56)

Call stack progression:
- `_main`
- `UIApplicationMain` -> `_main`
- `-[AppDelegate application:didFinishLaunchingWithOptions:]` -> `UIApplicationMain` -> `_main`
- `-[AppDelegate setupSentry]` -> ... (deepest)

### Chunk 2 - View Loading (timestamps ~1724777211.57 - 1724777211.63)

Call stack progression:
- `-[ViewController viewDidLoad]`
- `-[ViewController setupUI]` -> `viewDidLoad`
- `-[ViewController loadData]` -> `setupUI` -> `viewDidLoad`
- `-[NetworkManager fetchItems]` -> ... (deepest)

## Transaction Spans

The transaction includes the following spans:
- `app.start.cold` - Cold App Start (60ms)
- `ui.load` - ViewController.viewDidLoad (60ms)
  - `http.client` - GET /api/items (40ms)
