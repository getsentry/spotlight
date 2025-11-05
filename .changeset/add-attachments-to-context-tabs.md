---
"@spotlightjs/overlay": minor
"@spotlightjs/spotlight": minor
"@spotlightjs/electron": minor
---

Display attachments in Event and Trace Context tabs

This implements attachment display in the Context tabs of Error and Trace detail pages. Attachments from envelopes are now associated with their events/traces during envelope parsing and displayed alongside other context information.

Changes:
- Added `EventAttachment` type definition to store attachment headers and data
- Added optional `attachments` field to event types
- Updated envelope parsing to collect and associate attachments with events
- Added attachment rendering in EventContexts component
- Attachments are displayed for both individual events and traces (via root transaction)
- Supports all content types: images, videos, JSON, code, and text files

Fixes #274
