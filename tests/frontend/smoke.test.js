/**
 * Basic smoke test specification for LinkPulse frontend.
 */
describe("LinkPulse Frontend Foundation", () => {
  it("verifies environment variables configuration", () => {
    const apiBaseUrl = process.env.VITE_API_BASE_URL || "http://localhost:8000/api";
    expect(apiBaseUrl).toBeDefined();
    expect(apiBaseUrl).toContain("/api");
  });
});
