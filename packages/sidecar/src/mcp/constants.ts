import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const NO_ERRORS_CONTENT: CallToolResult = {
  content: [
    {
      type: "text",
      text: `**No errors detected in Spotlight**

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
      text: `**No logs detected in Spotlight**

**This means:**
- Application hasn't generated any log messages in the recent timeframe
- No debug, info, warning, or trace messages were captured
- Application might be idle or not actively processing requests

**Next debugging steps:**

1. **If investigating application behavior:**
   - Have user interact with the application (navigate pages, submit forms, trigger features)
   - Run this tool again after user activity to capture runtime logs
   - Logs appear in real-time as your application executes

2. **If checking for specific functionality:**
   - Trigger the feature or workflow you're investigating
   - Look for custom logging statements in your code
   - Consider adding more logging to critical paths if needed

3. **If monitoring general health:**
   - Check that logging is properly configured in your application
   - Verify that Spotlight is correctly capturing your log output
   - Test with known log-generating actions (API calls, database operations)

4. **Expand search timeframe:**
   - Use a longer duration (300+ seconds) to capture older log entries
   - Consider that some operations might generate logs less frequently

**Log Levels to expect:**
- **INFO**: General application flow and significant events
- **WARN**: Potential issues or important notices
- **DEBUG**: Detailed execution information
- **ERROR**: Failures (also check errors_search tool)

**Pro tip:** Absence of logs doesn't mean your application isn't working - it might just be running quietly. Many applications only log during significant events, errors, or when explicitly configured for verbose logging.`,
    },
  ],
};
