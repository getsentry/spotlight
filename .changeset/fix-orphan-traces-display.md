---
"@spotlightjs/overlay": patch
"@spotlightjs/spotlight": patch
---

Fix orphan traces not displaying in the UI when parent transactions are missing

This fixes an issue where backend transactions from distributed tracing scenarios would not be displayed in Spotlight when the frontend wasn't instrumented with spotlightBrowserIntegration. The transactions were being received and stored, but the UI wasn't able to properly extract and display the transaction name and method for traces without a root transaction.

Changes:
- Updated `getRootTransactionMethod` to fallback to the first transaction when `rootTransaction` is null
- Updated `getRootTransactionName` to use the first transaction's name for orphan traces
- Updated trace creation logic to set a more descriptive name for orphan traces
- Added debug logging to help identify when orphan traces are detected

