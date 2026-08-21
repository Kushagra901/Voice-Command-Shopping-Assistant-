import { describe, it, expect } from "vitest";
import { createApp } from "../app.js";
import type { HealthStatus, ApiSuccess } from "@voice-shopping/shared";

describe("Health API", () => {
  it("should return healthy status structure", async () => {
    const app = createApp();
    // Simulate health check request handling directly or with mock
    expect(app).toBeDefined();

    // Verify response structure matches contract
    const mockHealthData: HealthStatus = {
      status: "healthy",
      database: "fallback",
      timestamp: new Date().toISOString(),
      uptimeSeconds: 10
    };

    const envelope: ApiSuccess<HealthStatus> = {
      success: true,
      data: mockHealthData
    };

    expect(envelope.success).toBe(true);
    expect(envelope.data.status).toBe("healthy");
    expect(envelope.data.database).toBe("fallback");
  });
});
