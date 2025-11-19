# E2E Testing Guide for Spotlight

This directory contains end-to-end tests for Spotlight CLI and UI.

## Prerequisites

Before running e2e tests, you must build the Spotlight binary:

```bash
pnpm build
```

This creates `dist/run.js` which is required by all CLI tests.

**Note**: E2E tests are separate from unit tests. The `pnpm test` command runs only unit tests (using `vitest.config.ts`), while `pnpm test:e2e` runs the full E2E test suite (using `vitest.e2e.config.ts` for CLI tests and Playwright for UI tests). This separation ensures that CI can run unit tests without requiring a full build first.

## Running Tests

### All E2E Tests
```bash
pnpm test:e2e
```

### CLI Tests Only (vitest)
```bash
pnpm test:e2e:cli
```

### UI Tests Only (Playwright)
```bash
pnpm test:e2e:ui
```

### Watch Mode (CLI tests)
```bash
pnpm exec vitest --config vitest.e2e.config.ts
```

## Test Structure

```
tests/e2e/
├── cli/                      # CLI e2e tests (vitest)
│   ├── helpers.ts           # CLI test utilities
│   ├── tail.e2e.test.ts     # Tests for `spotlight tail` command
│   ├── run.e2e.test.ts      # Tests for `spotlight run` command
│   └── mcp.e2e.test.ts      # Tests for `spotlight mcp` command
├── ui/                       # UI e2e tests (Playwright)
│   ├── fixtures.ts          # Playwright fixtures
│   ├── errors.e2e.test.ts   # Error display tests
│   ├── traces.e2e.test.ts   # Trace display tests
│   ├── logs.e2e.test.ts     # Log display tests
│   ├── attachments.e2e.test.ts  # Attachment tests
│   └── integration.e2e.test.ts  # Integration tests
└── shared/
    └── utils.ts             # Shared test utilities
```

## CLI Tests Features

### Snapshot Testing
CLI tests use vitest snapshots to verify output format consistency:
- `tail -f json`: Validates JSON output and snapshots structure
- `tail -f logfmt`: Snapshots logfmt output
- `tail -f human`: Snapshots human-readable output
- `tail -f md`: Snapshots markdown output

### JSON Validation
Tests for `-f json` output verify:
- Every line is valid JSON
- Structure matches expected format
- No parsing errors

### Running Individual Tests
```bash
# Run specific test file
pnpm exec vitest run --config vitest.e2e.config.ts tests/e2e/cli/tail.e2e.test.ts

# Run specific test
pnpm exec vitest run --config vitest.e2e.config.ts -t "should output in json format"

# Update snapshots
pnpm exec vitest run --config vitest.e2e.config.ts -u
```

## UI Tests Features

UI tests use Playwright with:
- Sidecar auto-start/stop fixtures
- Multiple browser testing (Chrome, Firefox)
- Screenshot on failure
- Video recording on failure

### Running UI Tests
```bash
# Run all UI tests
pnpm test:e2e:ui

# Run specific UI test file
pnpm exec playwright test tests/e2e/ui/errors.e2e.test.ts

# Run with UI mode (interactive)
pnpm exec playwright test --ui

# Debug mode
pnpm exec playwright test --debug
```

## Debugging

### CLI Tests
1. Check that spotlight binary is built: `ls -la dist/run.js`
2. Run tests with verbose output: `pnpm exec vitest --config vitest.e2e.config.ts --reporter=verbose`
3. Check individual test output in console

### UI Tests
1. Use Playwright's debug mode: `pnpm exec playwright test --debug`
2. Check screenshots in `test-results/` directory
3. Use trace viewer: `pnpm exec playwright show-trace trace.zip`

## Common Issues

### "No test files found"
- Make sure you're in the `packages/spotlight` directory
- For CLI e2e tests, use `--config vitest.e2e.config.ts` to run with the correct configuration
- Unit tests and e2e tests use separate vitest configs

### "spotlight binary not found"
- Run `pnpm build` to create the binary
- Check that `dist/run.js` exists

### "Port already in use"
- Tests use dynamic port allocation to avoid conflicts
- If a test hangs, kill any lingering spotlight processes:
  ```bash
  pkill -f "spotlight"
  ```

### Snapshot Mismatches
- Review the diff carefully
- If the change is intentional, update snapshots:
  ```bash
  pnpm exec vitest run --config vitest.e2e.config.ts -u
  ```

## CI/CD

Tests are designed to run in CI with:
- Proper cleanup of child processes
- Dynamic port allocation
- Retries on failure (Playwright)
- Parallel execution limits in CI
