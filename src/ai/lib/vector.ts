import { ChromaClient, type Collection } from "chromadb"
import { embedder } from "./embedder"

export class AudiobookVectorDB {
  private client: ChromaClient
  private collection: Collection | null

  constructor() {
    this.client = new ChromaClient({
      host: process.env.CHROMA_HOST ?? "localhost",
      port: parseInt(process.env.CHROMA_PORT ?? "8000"),
      ssl: false,
      auth: undefined,
    })
    this.collection = null
  }

  async initialize(bookId: string) {
    try {
      this.collection = await this.client.getOrCreateCollection({
        name: `audiobook_${bookId}`,
        metadata: { "hnsw:space": "cosine" },
        embeddingFunction: embedder(),
      })

      console.info(`Collection initialized: ${this.collection?.name}`)
    } catch (error) {
      console.error("Vector DB initialization failed:", error)
    }
  }

  async clearCollection(bookId: string) {
    try {
      const collectionName = `audiobook_${bookId}`
      await this.client.deleteCollection({ name: collectionName })
      console.log(`Cleared collection: ${collectionName}`)
    } catch (error) {
      console.error("Failed to clear collection:", error)
    }
  }

  async addChunks(
    chunks: {
      text: string
      startTime: number
      endTime: number
      chapterIndex: number
      wordCount: number
      keyPhrases: string[]
    }[]
  ) {
    if (!this.collection) {
      throw new Error("Collection not initialized")
    }

    for (let i = 0; i < chunks.length; i++) {
      console.info(`Adding chunk ${i + 1} of ${chunks.length}`)
      const chunk = chunks[i]

      await this.collection.add({
        ids: [`chunk_${i}`],
        documents: [chunk.text], // ChromaDB will auto-generate embeddings
        metadatas: [
          {
            startTime: chunk.startTime,
            endTime: chunk.endTime,
            chapterIndex: chunk.chapterIndex,
            wordCount: chunk.wordCount,
            keyPhrases: chunk.keyPhrases?.join(", ") || "",
          },
        ],
      })

      console.info(`Chunk ${i + 1}: added to database`)
    }
  }

  async searchSimilar(query: string, nResults = 3) {
    if (!this.collection) {
      throw new Error("Collection not initialized")
    }

    const results = await this.collection.query({
      queryTexts: [query], // ChromaDB will auto-generate embeddings using the collection's embedding function
      nResults,
      include: ["documents", "metadatas", "distances"],
    })

    const documents = results.documents[0]

    if (!documents) {
      return []
    }

    return documents.map((doc: string | null, i: number) => ({
      text: doc,
      metadata: results.metadatas[0][i],
      similarity: 1 - (results.distances?.[0]?.[i] ?? 0),
    }))
  }

  async searchSimilarWithExpansion(query: string, nResults = 5) {
    // Original query
    const primaryResults = await this.searchSimilar(query, nResults)

    // If results are poor, try query expansion
    if (primaryResults.length === 0 || primaryResults[0]?.similarity < 0.5) {
      // Extract key terms and search again
      const keyTerms = query
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter(term => term.length > 3)
        .slice(0, 3) // Top 3 terms
        .join(" ")

      const expandedResults = await this.searchSimilar(keyTerms, nResults)

      // Combine and deduplicate results
      const combined = [...primaryResults, ...expandedResults]
      const unique = combined.filter(
        (result, index, self) => index === self.findIndex(r => r.metadata?.startTime === result.metadata?.startTime)
      )

      return unique.slice(0, nResults)
    }

    return primaryResults
  }
}

export const vectorDb = new AudiobookVectorDB()
