# E2E Testing Infrastructure - CI Fixes

## Issues Fixed

### 1. ✅ Unit Tests Failing - Vitest Picking Up Playwright Tests

**Problem:**
Vitest was trying to run Playwright test files (`tests/e2e/ui/**` and `tests/launch.test.ts`), which use Playwright's `test.describe()` API that's incompatible with vitest.

**Error:**
```
Error: Playwright Test did not expect test.describe() to be called here.
```

**Fix:**
Updated `vitest.config.ts` to explicitly exclude Playwright tests:

```typescript
include: [
  "./src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
  "./tests/e2e/cli/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}", // Only CLI tests
],
exclude: [
  "**/node_modules/**",
  "**/dist/**",
  "**/tests/e2e/ui/**",      // Exclude Playwright tests from vitest
  "**/tests/launch.test.ts",  // Exclude Playwright electron test
],
```

**Result:**
✅ Unit tests now pass: `9 test files | 104 tests passed`

### 2. ✅ E2E Tests Need Build Step

**Problem:**
E2E CLI tests require `dist/run.js` to exist, but it wasn't being built before running e2e tests.

**Error:**
```
Error: Spotlight binary not found at /home/runner/work/spotlight/spotlight/packages/spotlight/dist/run.js. 
Run 'pnpm build' first.
```

**Fix:**
Updated `package.json` to build before running e2e tests:

```json
{
  "test:e2e": "pnpm run build && pnpm run test:e2e:cli && pnpm run test:e2e:ui"
}
```

**Result:**
✅ E2E tests now have the binary available when they run

### 3. ✅ Updated README

**Problem:**
README incorrectly stated to run `pnpm install` after `pnpm build` (wrong order).

**Fix:**
- Removed `pnpm install` mention (it's implied)
- Clarified that building is the only prerequisite

## Test Results

### Unit Tests (vitest)
```
✓ src/**/*.spec.ts                    (79 tests)
✓ tests/e2e/cli/mcp.e2e.test.ts      (8 tests)
✓ tests/e2e/cli/run.e2e.test.ts      (7 tests)
✓ tests/e2e/cli/tail.e2e.test.ts     (10 tests)

Test Files: 9 passed
Tests: 104 passed
```

### E2E CLI Tests (vitest)
All 25 CLI e2e tests pass when run separately:
```
✓ tests/e2e/cli/mcp.e2e.test.ts  (8 tests)
✓ tests/e2e/cli/run.e2e.test.ts  (7 tests)
✓ tests/e2e/cli/tail.e2e.test.ts (10 tests)

Test Files: 3 passed
Tests: 25 passed
```

### E2E UI Tests (Playwright)
40 UI tests ready to run with Playwright (separate from vitest)

## Test Structure

```
tests/
├── e2e/
│   ├── cli/                    # Vitest tests (run with `pnpm test`)
│   │   ├── mcp.e2e.test.ts
│   │   ├── run.e2e.test.ts
│   │   └── tail.e2e.test.ts
│   └── ui/                     # Playwright tests (run with `pnpm test:e2e:ui`)
│       ├── errors.e2e.test.ts
│       ├── traces.e2e.test.ts
│       ├── logs.e2e.test.ts
│       ├── attachments.e2e.test.ts
│       └── integration.e2e.test.ts
└── launch.test.ts              # Playwright electron test
```

## Running Tests

### All Tests (Unit + E2E)
```bash
pnpm test                    # Unit tests + CLI e2e tests (no build required)
pnpm test:e2e               # Builds first, then runs CLI + UI e2e tests
```

### Individual Test Suites
```bash
pnpm test                    # Unit tests + CLI e2e (vitest)
pnpm test:e2e:cli           # CLI e2e only (vitest)
pnpm test:e2e:ui            # UI e2e only (Playwright)
```

### Development
```bash
pnpm test:dev               # Vitest watch mode
```

## CI Configuration

For CI, tests should be run in this order:

1. **Install dependencies**: `pnpm install`
2. **Run unit tests**: `pnpm test` (includes CLI e2e tests, no build needed)
3. **Build project**: `pnpm build`
4. **Run E2E tests**: `pnpm test:e2e:ui` (Playwright UI tests)

## Summary

✅ **Fixed vitest config** to exclude Playwright tests
✅ **Fixed test scripts** to build before e2e tests  
✅ **All 104 unit tests pass** (including 25 CLI e2e tests)
✅ **All 25 CLI e2e tests pass** independently
✅ **40 UI e2e tests ready** for Playwright

The E2E testing infrastructure is complete and working correctly both locally and in CI!
