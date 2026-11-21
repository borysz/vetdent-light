import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Project rule: source code, identifiers, comments and URIs are always English. Hungarian lives only in
 * messages/, docs/ and the root documents. This guards the code folders against accented Hungarian text.
 */
const root = join(__dirname, "..");
const codeDirs = ["src", "scripts", "tests", "supabase"];
const codeExtensions = new Set([".ts", ".tsx", ".mts", ".mjs", ".css", ".sql"]);
const hungarianLetters = /[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/;
const selfPath = join("tests", "language.test.ts");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (name === "node_modules" || name === ".temp") return [];
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

describe("language rule", () => {
  it("keeps code, comments and URIs free of Hungarian text", () => {
    const offenders: string[] = [];
    for (const dir of codeDirs) {
      for (const path of files(join(root, dir))) {
        const rel = relative(root, path);
        if (rel === selfPath || !codeExtensions.has(extname(path))) continue;
        readFileSync(path, "utf8")
          .split("\n")
          .forEach((line, index) => {
            if (hungarianLetters.test(line)) offenders.push(`${rel}:${index + 1}: ${line.trim()}`);
          });
      }
    }
    expect(offenders).toEqual([]);
  });

  it("uses English route names only", () => {
    const routeDirs = files(join(root, "src", "app"))
      .map((path) => relative(join(root, "src", "app"), path).split(/[\\/]/).slice(0, -1))
      .flat()
      .filter((segment) => !segment.startsWith("(") && !segment.startsWith("["));
    const hungarianSegments = ["belepes", "lapok", "paciens", "kezeles", "gyogyszer", "zarojelentes", "rendelo"];
    expect(routeDirs.filter((s) => hungarianSegments.includes(s))).toEqual([]);
  });
});
