import OpenAI from "openai";

export function newOpenai(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}
