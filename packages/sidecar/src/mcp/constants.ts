import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const NO_ERRORS_CONTENT: CallToolResult = {
  content: [
    {
      type: "text",
      text: `**No errors detected in Spotlight** (last 60 seconds)

**This means:**
- Application is currently running without runtime failures
- No crashes, exceptions, or critical issues in the recent timeframe
- System appears stable at the moment

**Next debugging steps:**

1. **If user reports a specific issue:**
   - Ask them to reproduce the problem (click the button, submit the form, navigate to the page)
   - Run this tool again immediately after they reproduce it
   - Errors will appear in real-time as they happen

2. **If investigating existing code:**
   - Check application logs separately
   - Look for TODO comments, error handling gaps, or potential edge cases in the code
   - Consider testing error scenarios (invalid inputs, network failures, etc.)

3. **Proactive error detection:**
   - Have user interact with recently changed features
   - Test API endpoints or database operations that might be fragile
   - Check pages/features mentioned in recent commits

** Pro tip:** Absence of errors doesn't mean absence of bugs - it just means no runtime failures occurred recently. The issue might be logical errors, UI problems, or dormant bugs waiting for specific conditions.`,
    },
  ],
};

export const NO_LOGS_CONTENT: CallToolResult = {
  content: [
    {
      type: "text",
      text: `**No errors detected in Spotlight** (last 60 seconds)

**This means:**
- Application is currently running without runtime failures
- No crashes, exceptions, or critical issues in the recent timeframe
- System appears stable at the moment

**Next debugging steps:**

1. **If user reports a specific issue:**
   - Ask them to reproduce the problem (click the button, submit the form, navigate to the page)
   - Run this tool again immediately after they reproduce it
   - Errors will appear in real-time as they happen

2. **If investigating existing code:**
   - Check application logs separately
   - Look for TODO comments, error handling gaps, or potential edge cases in the code
   - Consider testing error scenarios (invalid inputs, network failures, etc.)

3. **Proactive error detection:**
   - Have user interact with recently changed features
   - Test API endpoints or database operations that might be fragile
   - Check pages/features mentioned in recent commits

** Pro tip:** Absence of errors doesn't mean absence of bugs - it just means no runtime failures occurred recently. The issue might be logical errors, UI problems, or dormant bugs waiting for specific conditions.`,
    },
  ],
};
