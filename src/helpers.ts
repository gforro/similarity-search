import { readFile, writeFile } from "fs/promises";
import { DataFile, PersonType } from "./model";

export async function wait(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

export function countToken(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function loadData(filePath: string): Promise<Array<PersonType>> {
  const fileContent = await readFile(filePath, "utf-8");
  const data = DataFile.parse(JSON.parse(fileContent));
  return data;
}

export async function storeResult(
  filePath: string,
  result: string
): Promise<void> {
  await writeFile(filePath, result);
}

export function parseNumber(text: unknown): number | undefined {
  if (typeof text !== "string") {
    return undefined;
  }
  const num = parseInt(text);
  return isNaN(num) ? undefined : num;
}
