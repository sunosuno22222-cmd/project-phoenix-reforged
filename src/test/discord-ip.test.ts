import { describe, expect, it } from "vitest";
import { ownsIpControl, portalPanel, privateEyePanel } from "@/lib/discord-ip";

describe("Olho do Inferno privacy", () => {
  it("does not mark the public portal as private", () => {
    expect("flags" in portalPanel).toBe(false);
  });
  it("makes the eye visible only to the person who entered", () => {
    expect(privateEyePanel("12345").flags).toBe(64);
  });
  it("only allows the person who entered to use the eye controls", () => {
    expect(ownsIpControl("ip_input:12345", "12345")).toBe(true);
    expect(ownsIpControl("ip_input:12345", "67890")).toBe(false);
    expect(ownsIpControl("ip_close:12345", "67890")).toBe(false);
  });
});