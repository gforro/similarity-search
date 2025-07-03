import { appendFile, readFile } from "fs/promises";
import { DataFile, type PersonType } from "./model";

async function loadData(filePath: string): Promise<Array<PersonType>> {
  const fileContent = await readFile(filePath, "utf-8");
  const data = DataFile.parse(JSON.parse(fileContent));
  return data;
}

async function storeResult(filePath: string, result: string): Promise<void> {
  await appendFile(filePath, result);
}

export { loadData };
