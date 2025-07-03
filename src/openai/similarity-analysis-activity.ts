import OpenAI from "openai";
import { countToken } from "../helpers";
import { SimilarityResponse, PersonType } from "../model";
import { LLMActivity, LLMResponse } from "./types";

export interface FindSimilarTask<R> {
  personToEvaluate: R;
  candidates: R[];
}

type Response = {
  recordToMatch: PersonType;
  bestMatch: PersonType;
  similarity: number;
  diffSummary: string;
};

export class SimilarityAnalysisActivity
  implements LLMActivity<FindSimilarTask<PersonType>, string, Response>
{
  constructor(private openai: OpenAI) {}

  private getPersonText(person: PersonType): string {
    return `  Name: ${person.name}
  Job title: ${person.title}
  Skills of the person: ${person.skills.join(", ")}
  Short summary about the person: ${person.summary}`;
  }

  private getCandidatesListText(candidates: PersonType[]): string {
    return candidates
      .map(
        (c, i) => `Person ${i + 1}:
${this.getPersonText(c)}`
      )
      .join("\n\n");
  }

  transform(record: FindSimilarTask<PersonType>): string {
    return `I got a record, which represents a person and also a set of records, which represents very similar persons. 
Analyse the similarity and return the order number of most similar person, a similarity score between 0 and 1, where 1 represents a 100%.
Also provide a short difference summary between the evaluated person and the best match from the set. Difference summary can be something like "Skills updated from X to Y" or "Title changed from A to B", etc.

Person to evaluate:
${this.getPersonText(record.personToEvaluate)}


Set of persons to compare:
${this.getCandidatesListText(record.candidates)}

Return JSON format:
{
  "bestMatch": <best_match_order_num>,
  "similarity": <score_0_to_1>,
  "diffSummary": "<difference_summary>",
}`;
  }

  estimateToken(message: string): number {
    return countToken(message);
  }

  async callLLM(
    message: string,
    record: FindSimilarTask<PersonType>
  ): Promise<LLMResponse<Response>> {
    const { data, response: httpResponse } = await this.openai.chat.completions
      .create({
        model: "o4-mini",
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
        // max_completion_tokens: 5000, - it is better to limit, but it can result empty result with length reason
        // can be fixed if required but keep unlimited for now
      })
      .withResponse();
    if (!data.choices[0]?.message.content) {
      //todo better error handling - see an example above about the max completition token
      throw new Error("chat completition is missing from openai response");
    }
    console.log(data.choices[0].message.content);
    const llmResponse = SimilarityResponse.parse(
      JSON.parse(data.choices[0].message.content)
    );
    const bestMatch = record.candidates[llmResponse.bestMatch - 1];
    if (!bestMatch) {
      console.log(
        "Bad index for the best match in LLM response",
        JSON.stringify(llmResponse, undefined, 2)
      );
      throw new Error(
        "LLM returned an invalid index for the provided set of possible matches"
      );
    }

    const response = {
      recordToMatch: record.personToEvaluate,
      bestMatch,
      similarity: llmResponse.similarity,
      diffSummary: llmResponse.diffSummary,
    };

    return {
      response,
      headers: httpResponse.headers,
      usedToken: data.usage?.total_tokens ?? this.estimateToken(message) + 5000,
    };
  }
}
