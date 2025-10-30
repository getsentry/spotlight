---
"@spotlightjs/electron": patch
---

Fix envelope download 404 error in Electron app

- Added proper download handlers to intercept /envelope/ URLs and trigger downloads
- Updated CSP to allow localhost connections while maintaining security
- Fixed issue where clicking envelope download links would result in 404 errors
