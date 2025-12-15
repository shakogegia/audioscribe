import { prisma } from "@/lib/prisma"

async function main() {
  const suggestions = [
    "Summerize the last 10 minutes",
    "Summerize the current chapter",
    "Summerize the last chapter",
    "Who are the main characters?",
    "Summarize what just happened",
    "What are the key themes so far?",
    "Explain what I just heard",
    "What's the significance of this scene?",
  ]

  await prisma.chatQuickQuestion.createMany({
    data: suggestions.map(suggestion => ({
      question: suggestion,
    })),
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async e => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
