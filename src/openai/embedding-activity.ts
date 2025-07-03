import OpenAI from "openai";
import { countToken } from "../helpers";
import { PersonType } from "../model";
import { LLMActivity, LLMResponse } from "./types";

export class EmbeddingActivity
  implements LLMActivity<PersonType, string, number[]>
{
  constructor(private openai: OpenAI) {}

  transform(record: PersonType): string {
    const skillsText = record.skills.join(", ");
    return `Name: ${record.name}
Title: ${record.title}
Summary: ${record.summary}
Skills: ${skillsText}`;
  }

  estimateToken(message: string): number {
    return countToken(message);
  }

  async callLLM(message: string): Promise<LLMResponse<number[]>> {
    const { data, response } = await this.openai.embeddings
      .create({
        model: "text-embedding-3-small",
        input: message,
      })
      .withResponse();
    if (!data.data[0]?.embedding) {
      //todo better error handling
      throw new Error("embedding is missing from openai response");
    }

    return {
      response: data.data[0]?.embedding,
      headers: response.headers,
      usedToken: data.usage.total_tokens ?? this.estimateToken(message),
    };
  }
}
