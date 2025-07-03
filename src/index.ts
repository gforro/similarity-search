import chalk from "chalk";
import { EmbeddingProcess } from "./embedding-process";
import { loadData, storeResult } from "./helpers";
import { SimilarityAnalysisActivity as SimilarityAnalysisActivity } from "./openai/similarity-analysis-activity";
import { EmbeddingActivity } from "./openai/embedding-activity";
import { newOpenai } from "./openai/openai-factory";
import { OpenAIActivityManager } from "./openai/openai-activity-manager";
import { OpenAIHeadersChecker } from "./ratelimit/openai-headers-checker";
import { SimilarityAnalysis } from "./similarity-analysis-process";
import { HNSWStorage } from "./storage/hnsw";
import pLimit from "p-limit";

async function main() {
  const openaiKey = process.env.OPENAI_KEY;
  if (!openaiKey) {
    console.error(chalk.red("OPENAI_KEY environment variable is not defined"));
    return;
  }
  const data = await loadData("files/datasetB.json");

  // create components for the workflow
  const openai = newOpenai(openaiKey);
  // rate limit checker for embeddings call
  const embeddingRateLimit = new OpenAIHeadersChecker();
  // rate limit checker for the similarity report done through chat completition
  const chatCompletitionRateLimit = new OpenAIHeadersChecker();
  //
  const embeddingActivity = new EmbeddingActivity(openai);
  const similarityAnalysisActivity = new SimilarityAnalysisActivity(openai);
  const openaiEmbeddingCalculator = new OpenAIActivityManager(
    embeddingRateLimit,
    embeddingActivity
  );
  const openaiSimilarityChecker = new OpenAIActivityManager(
    chatCompletitionRateLimit,
    similarityAnalysisActivity
  );
  const vectorStorage = new HNSWStorage(data.length);

  const embeddingProcess = new EmbeddingProcess(
    openaiEmbeddingCalculator,
    vectorStorage
  );
  const similaritySearchProcess = new SimilarityAnalysis(
    openaiEmbeddingCalculator,
    vectorStorage,
    openaiSimilarityChecker
  );
  const limiter = pLimit(20);

  const embedRecords = data.map((r) =>
    limiter(() => embeddingProcess.execute(r))
  );
  await Promise.all(embedRecords);

  const recordsToCheck = await loadData("files/datasetA.json");

  const similarRecords = recordsToCheck.map((r) =>
    limiter(() => similaritySearchProcess.execute(r))
  );
  const results = await Promise.all(similarRecords);
  storeResult(
    "files/comparision_report.json",
    JSON.stringify(results, undefined, 2)
  );
}

main()
  .then(() => console.log("done"))
  .catch((error) => {
    console.error("Application failed:", error);
    process.exit(1);
  });
