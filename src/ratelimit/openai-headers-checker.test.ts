import { test, describe } from "node:test";
import assert from "node:assert";
import { parseDuration } from "./openai-headers-checker";

const ms1hour = 60 * 60 * 1000;
const ms1min = 60 * 1000;
const ms1sec = 1000;

describe("rate limit reset period parsers", () => {
  describe("parseDuration", () => {
    test("should parse milliseconds", () => {
      assert.strictEqual(parseDuration("15ms"), 15);
    });
    test("should parse hours", () => {
      assert.strictEqual(parseDuration("15h"), 15 * ms1hour);
    });
    test("should parse minutes", () => {
      assert.strictEqual(parseDuration("15m"), 15 * ms1min);
    });
    test("should parse seconds", () => {
      assert.strictEqual(parseDuration("15s"), 15 * ms1sec);
    });
    test("should parse more complex time", () => {
      assert.strictEqual(
        parseDuration("3h30m15s140ms"),
        3 * ms1hour + 30 * ms1min + 15 * ms1sec + 140
      );
    });
    test("should parse decimal minute", () => {
      assert.strictEqual(parseDuration("1.5m"), 1.5 * ms1min);
    });
  });
});
