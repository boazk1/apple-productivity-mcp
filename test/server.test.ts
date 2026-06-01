import { describe, expect, it } from "vitest";

import { calendarDateSchema, dueDateSchema } from "../src/server.js";

describe("server schemas", () => {
  it("accepts ISO due dates with timezone offsets", () => {
    expect(dueDateSchema.safeParse("2026-06-01T09:00:00+02:00").success).toBe(true);
  });

  it("rejects invalid due date strings", () => {
    expect(dueDateSchema.safeParse("next sometime maybe").success).toBe(false);
  });

  it("validates calendar dates", () => {
    expect(calendarDateSchema.safeParse("2026-06-01T09:00:00+02:00").success).toBe(true);
    expect(calendarDateSchema.safeParse("not-a-date").success).toBe(false);
  });
});
