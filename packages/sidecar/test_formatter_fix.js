#!/usr/bin/env node
const fs = require("node:fs");
const { processEnvelope } = require("./dist/parser/processEnvelope.js");
const { humanFormatters } = require("./dist/formatters/index.js");
const { applyFormatter } = require("./dist/formatters/types.js");

// Read and parse a fixture file
const fixturePath = process.argv[2] || "_fixtures/Capture.Message.txt";
const fixtureData = fs.readFileSync(fixturePath);

console.log(`\nTesting fixture: ${fixturePath}\n`);
console.log("=".repeat(60));

try {
  // Process the envelope
  const parsed = processEnvelope({
    contentType: "application/x-sentry-envelope",
    data: fixtureData,
  });

  if (!parsed) {
    console.error("Failed to parse envelope");
    process.exit(1);
  }

  const [envelopeHeader, items] = parsed.envelope;

  console.log(`\nParsed ${items.length} item(s) from envelope\n`);

  // Try to format each item
  for (const [itemHeader, payload] of items) {
    const type = itemHeader.type;
    console.log(`\nProcessing item type: ${type}`);
    console.log(`Event type: ${payload.type || "(none)"}`);
    console.log(`Has exception: ${Boolean(payload.exception)}`);
    console.log(`Has message: ${Boolean(payload.message)}`);

    // Check if formatter supports this type
    if (!(type in humanFormatters)) {
      console.log(`⚠️  Formatter doesn't support type: ${type}`);
      continue;
    }

    // Try to apply the formatter
    try {
      const result = applyFormatter(humanFormatters, type, payload, envelopeHeader);

      if (result.length === 0) {
        console.log("⚠️  Type guard failed - event skipped (this is OK!)");
      } else {
        console.log("✅ Successfully formatted:");
        for (const line of result) {
          console.log(`  ${line}`);
        }
      }
    } catch (error) {
      console.error("❌ ERROR during formatting:", error.message);
      process.exit(1);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("✅ All items processed successfully - no crashes!");
  console.log(`${"=".repeat(60)}\n`);
} catch (error) {
  console.error("\n❌ FATAL ERROR:", error);
  console.error(error.stack);
  process.exit(1);
}
