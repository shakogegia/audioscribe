const { ChromaClient } = require("chromadb");
const { OllamaEmbeddingFunction } = require("@chroma-core/ollama");

const embedder = new OllamaEmbeddingFunction({
  url: "http://127.0.0.1:11434",
  model: "all-minilm:latest",
});

module.exports.AudiobookVectorDB = class AudiobookVectorDB {
  constructor() {
    // Configure ChromaDB to connect to local ChromaDB server
    this.client = new ChromaClient({
      host: "localhost",
      port: 8000,
      ssl: false,
      auth: undefined,
    });
    this.collection = null;
  }

  async initialize(bookId) {
    try {
      this.collection = await this.client.getOrCreateCollection({
        name: `audiobook_${bookId}`,
        metadata: { "hnsw:space": "cosine" },
        embeddingFunction: embedder,
      });
    } catch (error) {
      console.error("Vector DB initialization failed:", error);
    }
  }

  async clearCollection(bookId) {
    try {
      const collectionName = `audiobook_${bookId}`;
      await this.client.deleteCollection({ name: collectionName });
      console.log(`Cleared collection: ${collectionName}`);
    } catch (error) {
      console.error("Failed to clear collection:", error);
    }
  }

  async addChunks(chunks) {
    for (let i = 0; i < chunks.length; i++) {
      console.info(`Adding chunk ${i + 1} of ${chunks.length}`);
      const chunk = chunks[i];
      const embedding = await embedder.generate([chunk.text]);
      console.info(`Chunk ${i + 1}: generated embedding`);

      await this.collection.add({
        ids: [`chunk_${i}`],
        documents: [chunk.cleanText || chunk.text], // Use cleaned text for embeddings
        embeddings: embedding,
        metadatas: [
          {
            startTime: chunk.startTime,
            endTime: chunk.endTime,
            chapterIndex: chunk.chapterIndex,
            originalText: chunk.text, // Store original for display
            wordCount: chunk.wordCount,
            keyPhrases: chunk.keyPhrases?.join(", ") || "",
          },
        ],
      });

      console.info(`Chunk ${i + 1}: added to database`);
    }
  }

  async searchSimilar(query, nResults = 3) {
    const queryEmbedding = await embedder.generate([query]);

    const results = await this.collection.query({
      queryEmbeddings: queryEmbedding,
      nResults,
      include: ["documents", "metadatas", "distances"],
    });

    return results.documents[0].map((doc, i) => ({
      text: doc,
      metadata: results.metadatas[0][i],
      similarity: 1 - results.distances[0][i],
    }));
  }
};
