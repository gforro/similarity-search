import OpenAI from "openai";
import { wait } from "./helpers";

interface RateLimitHandler {
  calculateWaitTime(token: number): number;
  startRequest(estimatedToken: number): void;
  updateLimits(responseHeaders: Headers): void;
}

interface LLMProcessor<Rec, Message, Res> {
  transform(record: Rec): Message;
  estimateToken(m: Message): number;
  callLLM(m: Message): Promise<[Res, Headers]>;
}

export class OpenAIManager<Rec, Message, Res> {
  constructor(
    private rateLimitHandler: RateLimitHandler,
    private processor: LLMProcessor<Rec, Message, Res>
  ) {}
  async execute(record: Rec): Promise<Res | undefined> {
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
        const [response, headers] = await this.processor.callLLM(m);
        this.rateLimitHandler.updateLimits(headers);

        return response;
      } catch (error) {
        if (error instanceof OpenAI.APIError) {
          if (error.headers) {
            this.rateLimitHandler.updateLimits(error.headers);

            let waitTime = 0;
            // todo calculate wait time and pause if needed
            waitTime = 1;

            if (waitTime > 0) {
              await wait(waitTime);
            }
          }
        }
        throw error;
      }
    }
    return undefined;
  }
}
