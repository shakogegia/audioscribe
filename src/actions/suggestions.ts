"use server"

import { prisma } from "@/lib/prisma"
import { ChatQuickQuestion } from "../../generated/prisma"
import { revalidatePath } from "next/cache"

export async function getSuggestions() {
  return await prisma.chatQuickQuestion.findMany()
}

export async function deleteSuggestion(id: string) {
  return await prisma.chatQuickQuestion.delete({
    where: { id },
  })
}

export async function createSuggestion(question: string) {
  return await prisma.chatQuickQuestion.create({
    data: { question },
  })
}

export async function updateSuggestion(id: string, question: string) {
  return await prisma.chatQuickQuestion.update({
    where: { id },
    data: { question },
  })
}

export async function updateSuggestions(suggestions: ChatQuickQuestion[]) {
  await prisma.chatQuickQuestion.deleteMany()
  await prisma.chatQuickQuestion.createMany({
    data: suggestions.map(suggestion => suggestion),
  })
  await revalidatePath("/authenticated/(navigation)/(config)", "layout")
}
