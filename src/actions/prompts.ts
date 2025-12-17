"use server"

import { PromptFormSchema, PromptFormState } from "@/lib/definitions"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getPrompts() {
  return await prisma.prompt.findMany()
}

export async function updatePrompt(state: PromptFormState, formData: FormData) {
  const validatedFields = PromptFormSchema.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    prompt: formData.get("prompt"),
    system: formData.get("system"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors as {
        slug?: string[]
        name?: string[]
        prompt?: string[]
        system?: string[]
      },
    }
  }

  const { slug, name, prompt, system } = validatedFields.data

  await prisma.prompt.update({
    where: { slug },
    data: { name, prompt, system },
  })

  revalidatePath("/authenticated/(navigation)/(prompts)", "layout")

  return {
    message: "Prompt updated",
  }
}
