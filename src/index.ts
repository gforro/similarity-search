import { loadData } from "./file-processor";

async function main() {
  const data = await loadData("files/datasetB.json");
  const names = data.map((p) => p.name);

  names.forEach(console.log);
}

main().then(() => console.log("done"));
