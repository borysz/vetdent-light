import { describe, expect, it } from "vitest";
import { describeChanges, projectRefOf, smtpChanges, urlChanges } from "../scripts/lib/auth-config";

describe("Supabase auth config change set", () => {
  it("reads the project ref from the project URL", () => {
    expect(projectRefOf("https://abcdefgh12345.supabase.co")).toBe("abcdefgh12345");
    expect(() => projectRefOf("https://example.org")).toThrow();
  });

  it("sets the site URL and adds the redirect URLs, keeping the existing ones", () => {
    const changes = urlChanges({ site_url: "http://localhost:3000", uri_allow_list: "https://other.example/**" }, "https://vetdent.hu/");
    expect(changes.site_url).toBe("https://vetdent.hu");
    expect(changes.uri_allow_list).toBe("https://other.example/**,https://vetdent.hu/**,http://localhost:6438/**");
  });

  it("changes nothing when everything is already set", () => {
    expect(
      urlChanges({ site_url: "https://vetdent.hu", uri_allow_list: "http://localhost:6438/**, https://vetdent.hu/**" }, "https://vetdent.hu"),
    ).toEqual({});
  });

  it("never sends other fields than the URLs (self sign-up stays as it is)", () => {
    const changes = urlChanges({ site_url: "", uri_allow_list: "", disable_signup: true }, "https://vetdent.hu");
    expect(Object.keys(changes).sort()).toEqual(["site_url", "uri_allow_list"]);
  });

  it("masks the SMTP password when the changes are printed", () => {
    const changes = smtpChanges({ host: "smtp.example.org", port: 465, user: "u", pass: "very-secret", senderEmail: "noreply@vetdent.hu", senderName: "VetDent" });
    expect(changes.smtp_port).toBe("465");
    const printed = describeChanges(changes).join("\n");
    expect(printed).not.toContain("very-secret");
    expect(printed).toContain("smtp_pass: ********");
  });
});
