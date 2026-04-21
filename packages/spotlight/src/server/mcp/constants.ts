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
- **ERROR**: Failures (also check search_errors tool)

**Pro tip:** Absence of logs doesn't mean your application isn't working - it might just be running quietly. Many applications only log during significant events, errors, or when explicitly configured for verbose logging.`,
    },
  ],
};

export const NO_METRICS_CONTENT: CallToolResult = {
  content: [
    {
      type: "text",
      text: `**No metrics detected in Spotlight**

**This means:**
- Application hasn't generated any metrics in the recent timeframe
- No counter, gauge, or distribution metrics were captured
- Application might not be instrumented with Sentry metrics SDK

**Next debugging steps:**

1. **If investigating application metrics:**
   - Ensure your Sentry SDK has metrics enabled (JavaScript 10.25.0+, Python 2.44.0+)
   - Verify metrics are being sent via \`trace_metric\` envelope items
   - Check that Spotlight is correctly capturing metric envelopes

2. **If checking for specific functionality:**
   - Trigger the feature or workflow you're investigating
   - Look for custom metric instrumentation in your code
   - Consider adding metrics to critical paths if needed

3. **If monitoring general health:**
   - Check that metrics SDK is properly configured
   - Verify that metrics are being emitted (check SDK logs)
   - Test with known metric-generating actions (API calls, database operations)

4. **Expand search timeframe:**
   - Use a longer duration (300+ seconds) to capture older metrics
   - Consider that some operations might generate metrics less frequently

**Metric Types Available:**
- **COUNTER**: Incrementing counts (e.g., request counts)
- **GAUGE**: Fluctuating values (e.g., queue depth)
- **DISTRIBUTION**: Statistical distributions (e.g., response times)

**Pro tip:** Metrics are trace-connected in Sentry - every metric can be linked to a trace for enhanced debugging. This is Sentry's key differentiator for metrics!`,
    },
  ],
};
