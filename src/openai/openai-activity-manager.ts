import OpenAI from "openai";
import { parseNumber, wait } from "../helpers";
import { RateLimitHandler } from "../ratelimit/types";
import { LLMActivity } from "./types";
import chalk from "chalk";

export class OpenAIActivityManager<Rec, Message, Res> {
  constructor(
    private rateLimitHandler: RateLimitHandler,
    private processor: LLMActivity<Rec, Message, Res>,
    private defaultRetryDelayMs = 10000
  ) {}
  async execute(record: Rec): Promise<Res> {
    const m = this.processor.transform(record);
    const estimatedToken = this.processor.estimateToken(m);

    for (let attempt = 1; attempt < 3; attempt++) {
      try {
        const waitTime =
          this.rateLimitHandler.calculateWaitTime(estimatedToken);
        if (waitTime > 0) {
          await wait(waitTime);
        }
        this.rateLimitHandler.startRequest(estimatedToken);
        const { response, headers, usedToken } = await this.processor.callLLM(
          m,
          record
        );
        this.rateLimitHandler.processResponse(headers, estimatedToken);
        console.log(
          `openai called. Estimated token: ${estimatedToken}, used token: ${usedToken}, limits: ${this.rateLimitHandler}`
        );

        return response;
      } catch (error) {
        if (error instanceof OpenAI.APIError) {
          if (error.headers) {
            this.rateLimitHandler.processResponse(error.headers, 0);

            const retryAfterFromHeader = parseNumber(
              error.headers.get("retry-after")
            );
            const retryAfter =
              retryAfterFromHeader ??
              (this.rateLimitHandler.calculateWaitTime(estimatedToken) ||
                this.defaultRetryDelayMs * attempt);

            console.warn(
              chalk.yellow(
                `Rate limit error. Waiting ${Math.ceil(
                  retryAfter / 1000
                )}s before retry...`
              )
            );
            await wait(retryAfter);
            continue;
          }
        }
        throw error;
      }
    }
    throw new Error("LLM model could not be called");
  }
}
