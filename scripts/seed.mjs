/**
 * Database seed script — runs in production without tsx.
 * Mirrors prisma/seed.ts but uses plain JS with the generated Prisma client.
 */
import { PrismaClient } from "../generated/prisma/client.js"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

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

const prompts = [
  {
    slug: "ios-chapter-summary",
    description:
      "Generates a summary of the current or previous chapter of the audiobook. Used for iOS shortcuts endpoints.",
    name: "iOS - Chapter summary",
    prompt: `You are creating a chapter summary for an audiobook titled "{{ context.bookTitle }}". This will be read aloud using text-to-speech, so write it exactly as it should be spoken.

Based on the following transcript from {{ context.chapterType }} chapter, create a brief, engaging summary (2-4 sentences) of what happened so far.

Transcript:
{{ transcript }}

Requirements:
- If {{ context.chapterType }} is "the current", start with "Here's a spoiler-free summary of the current chapter, up to where you left off:"
- If {{ context.chapterType }} is "the previous", start with "Here's a summary of the previous chapter:"
- Write in a natural, conversational tone suitable for audio narration
- Use simple punctuation that works well with text-to-speech
- Avoid special formatting, bullet points, or text that doesn't sound natural when spoken
- Keep it concise and engaging, highlighting the key events or topics
- Focus on the most important plot points, character developments, or main ideas

Return ONLY the narration text, exactly as it should be spoken:`,
    system: "You are a helpful assistant that summarizes transcripts.",
  },
  {
    slug: "ios-previously-on",
    description: "Generates a summary of the last 10 minutes of the audiobook. Used for iOS shortcuts endpoints.",
    name: "iOS - Previously on",
    prompt: `You are creating a "Previously On" narration for an audiobook titled "{{ context.bookTitle }}". This will be read aloud using text-to-speech, so write it exactly as it should be spoken.

Based on the following transcript from the last 10 minutes, create a brief, engaging narration (2-3 sentences) of what happened.

Transcript:
{{ transcript }}

Requirements:
- Start with "Previously on {{ context.bookTitle }}:"
- Write in a natural, conversational tone suitable for audio narration
- Use simple punctuation that works well with text-to-speech
- Avoid special formatting, bullet points, or text that doesn't sound natural when spoken
- Keep it concise and engaging, like a TV show recap

Return ONLY the narration text, exactly as it should be spoken:`,
    system: 'You are a helpful assistant that generates "Previously On" narrations.',
  },
  {
    slug: "bookmark-suggestions",
    description: "Generates bookmark suggestions for an audiobook segment.",
    name: "Bookmark Suggestions",
    prompt: `Generate 3–5 concise bookmark titles for this audiobook segment:

Transcription: "
{{ transcription }}
"

Book: {{ context.bookTitle }}
Author(s): {{ context.authors }}
Bookmark at: {{ context.time }}

Requirements:

- Titles must be 2–10 words long.
- Prioritize powerful quotes or declarations from the text itself (e.g., "My honour remains").
- If no strong quote is present, create a short descriptive title capturing the main theme or turning point.
- Each title should be distinct, specific, and useful for navigation.
- Avoid generic terms (e.g., "Chapter 1," "Important moment").
- Return only a JSON array of suggested titles, no extra text.

Return only a JSON array of suggested titles:
["Title 1", "Title 2", "Title 3"]`,
    system: "You are a helpful assistant that generates bookmark titles for an audiobook.",
  },
  {
    slug: "chapter-summary",
    description: "Generates a summary of the chapter of the audiobook.",
    name: "Chapter summary",
    prompt: `You are creating a chapter summary for an audiobook titled "{{ context.bookTitle }}". This will be read aloud using text-to-speech, so write it exactly as it should be spoken.

Based on the following transcript from the current chapter, create a brief, engaging summary (2-4 sentences) of what happened so far.

Transcript:
{{ transcript }}`,
    system: "You are a helpful assistant that summarizes transcripts.",
  },
]

async function main() {
  // Seed suggestions (skip if already populated)
  const existingCount = await prisma.chatQuickQuestion.count()
  if (existingCount === 0) {
    await prisma.chatQuickQuestion.createMany({
      data: suggestions.map((question) => ({ question })),
    })
    console.log(`[Seed] Created ${suggestions.length} chat suggestions`)
  }

  // Seed prompts (upsert — only create if missing)
  let created = 0
  for (const prompt of prompts) {
    const existing = await prisma.prompt.findUnique({ where: { slug: prompt.slug } })
    if (!existing) {
      await prisma.prompt.create({ data: prompt })
      created++
    }
  }
  if (created > 0) {
    console.log(`[Seed] Created ${created} prompts`)
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("[Seed] Error:", e)
    await prisma.$disconnect()
    process.exit(1)
  })
