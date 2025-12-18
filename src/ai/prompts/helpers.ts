import { generate } from "@/ai/helpers/generate"
import { prisma } from "@/lib/prisma"
import handlebars from "handlebars"
import { provider } from "../providers"
import { AiModel, AiProvider } from "../types/ai"

type GetPromptParams = {
  slug: string
  params: Record<string, any>
}

type GetPromptResponse = {
  user: string
  system?: string
}

export async function getPrompt({ slug, params }: GetPromptParams): Promise<GetPromptResponse> {
  const prompt = await prisma.prompt.findUnique({
    where: { slug },
  })

  if (!prompt) {
    throw new Error("Prompt not found")
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compiledPrompt = handlebars.compile(prompt.prompt)(params)

  return {
    user: compiledPrompt,
    system: prompt.system ?? undefined,
  }
}

type GeneratePromptParams = {
  provider: AiProvider
  model: AiModel
  slug: string
  params: Record<string, any>
}

export async function generatePrompt(props: GeneratePromptParams): Promise<string> {
  try {
    // Get AI provider
    const ai = await provider(props.provider, props.model)

    // Get prompt
    const { user, system } = await getPrompt({ slug: props.slug, params: props.params })

    // Generate response
    const response = await generate(ai, user, system)

    // Return response
    return response
  } catch (error) {
    console.error(`Error generating prompt ${props.slug}:`, error)
    console.error(props)
    throw new Error(`Failed to generate prompt ${props.slug}`)
  }
}
