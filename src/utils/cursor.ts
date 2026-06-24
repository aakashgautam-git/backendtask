import { CursorPayload } from "../types/pagination";

export function encodeCursor(cursor: CursorPayload): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeCursor(cursor: string): CursorPayload {
  try {
    return JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf-8")
    ) as CursorPayload;
  } catch {
    throw new Error("Invalid cursor");
  }
}
const cursor = encodeCursor({
  createdAt: new Date().toISOString(),
  id: "123",
});

console.log(cursor);

console.log(decodeCursor(cursor));