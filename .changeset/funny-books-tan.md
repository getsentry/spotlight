---
"@spotlightjs/sidecar": minor
"@spotlightjs/spotlight": minor
---

Automatically recover when the upstream sidecar stops/goes away in MCP stdio proxy mode

- Tries to reconnect in case it was a blip or another server just took over
- If the reconnection fails, switches itself to be the main sidecar process

Caveat: it does not carry over the old events, we may wanna look into this in the future
