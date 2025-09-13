import { load } from "@/lib/config"
import { FeatureExtractionPipeline, pipeline } from "@xenova/transformers"
import type { EmbeddingFunction } from "chromadb"
import { join } from "path"

const fallbackModel = "sentence-transformers/distilbert-base-uncased"

const cache_dir = join(process.env.DATA_DIR!, "transformers")

class TransformersEmbeddingFunction implements EmbeddingFunction {
  private pipeline: FeatureExtractionPipeline | null = null

  async generate(texts: string[]): Promise<number[][]> {
    const config = await load()

    const model = config.embeddingModel ?? "sentence-transformers/all-MiniLM-L6-v2"

    if (!this.pipeline) {
      try {
        // Try a model that's known to work well with @xenova/transformers
        this.pipeline = await pipeline("feature-extraction", model, {
          quantized: false, // Try without quantization first
          cache_dir,
        })
      } catch (error) {
        console.warn(`Failed to load ${model} without quantization, trying with quantization:`, error)
        try {
          // Try with default settings (quantized)
          this.pipeline = await pipeline("feature-extraction", model, {
            cache_dir,
          })
        } catch (fallbackError) {
          console.warn(`Failed to load ${model}, trying ${fallbackModel}:`, fallbackError)
          // Final fallback to a model that's guaranteed to work
          this.pipeline = await pipeline("feature-extraction", fallbackModel, {
            cache_dir,
          })
        }
      }
    }

    const embeddings = await this.pipeline(texts, { pooling: "mean", normalize: true })

    // Convert tensor to number array
    return embeddings.tolist() as number[][]
  }

  defaultSpace() {
    return "cosine" as const
  }
}

export function embedder(): TransformersEmbeddingFunction {
  return new TransformersEmbeddingFunction()
}
