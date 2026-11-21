import { createInterface } from "node:readline";
import { MIN_PASSWORD_LENGTH } from "../../src/contracts/auth";

/** Terminal escape sequences (e.g. the bracketed-paste markers ESC[200~ / ESC[201~) and other control characters. */
const ESCAPE_SEQUENCE = /\u001b\[[0-9;?]*[ -/]*[@-~]/g;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

function clean(value: string): string {
  return value.replace(ESCAPE_SEQUENCE, () => "").replace(CONTROL_CHARS, () => "");
}

function readHidden(question: string): Promise<string> {
  if (!process.stdin.isTTY) {
    return new Promise((resolve) => {
      const rl = createInterface({ input: process.stdin });
      rl.once("line", (line) => {
        rl.close();
        resolve(clean(line));
      });
    });
  }
  return new Promise((resolve) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let buffer = "";
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          resolve(clean(buffer));
          return;
        }
        if (char === "\u0003") process.exit(130);
        if (char === "\u007f" || char === "\b") buffer = buffer.slice(0, -1);
        else buffer += char;
      }
    };
    stdin.on("data", onData);
  });
}

/**
 * Ask for a new password without echoing it. In a terminal it is asked twice and must match, so a typo or a
 * mangled paste cannot silently become the stored password. Piped input is read once.
 */
export async function promptNewPassword(): Promise<string> {
  const password = await readHidden(`Password (at least ${MIN_PASSWORD_LENGTH} characters): `);
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`The password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    process.exit(2);
  }
  if (process.stdin.isTTY) {
    const again = await readHidden("Password again: ");
    if (again !== password) {
      console.error("The two passwords do not match. Nothing was changed.");
      process.exit(2);
    }
  }
  return password;
}
