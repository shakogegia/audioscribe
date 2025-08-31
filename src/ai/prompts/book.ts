import { createPrompt } from "@/ai/helpers/prompt";
import { generate } from "@/ai/helpers/generate";
import fs from "fs/promises";
import { LanguageModel } from "ai";
import { join } from "path";
import { tempFolder } from "@/lib/utils";

export interface BookAnalysisRequest {
  message: string;
  transcriptions: { text: string }[];
  context: {
    bookTitle: string;
    authors: string[];
  };
}

export interface BookAnalysisResponse {
  analysis: string;
}

export async function generateBookAnalysis(
  provider: LanguageModel,
  request: BookAnalysisRequest
): Promise<BookAnalysisResponse> {
  const prompt = await createPrompt("book-query", request);
  // save prompt to file
  const promptFolder = join(tempFolder, "prompts");
  await fs.mkdir(promptFolder, { recursive: true });
  const filePath = join(promptFolder, `${Date.now()}.md`);
  await fs.writeFile(filePath, prompt);
  const response = await generate(provider, prompt);
  return { analysis: response };
}
