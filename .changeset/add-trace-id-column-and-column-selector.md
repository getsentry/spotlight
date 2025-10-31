---
"@spotlightjs/overlay": minor
"@spotlightjs/spotlight": minor
---

Add Trace ID column and column selector to logs view

- Added new Trace ID column to logs table with clickable links to trace details
- Implemented column selector dropdown to toggle visibility of log columns
- Column visibility preferences are persisted to localStorage
- Trace ID column is sortable like other columns
- Enhanced UX with truncated trace IDs and "N/A" fallback for missing values

Closes 2203b39d-9241-4509-8af5-73ad32633a06 and 43e2502a-3d89-4b16-8bde-ff1bd1911049
