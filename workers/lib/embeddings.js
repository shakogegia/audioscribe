let model = null;

module.exports.embeddings = {
  async generate(text) {
    if (!model) {
      const { pipeline } = await import("@xenova/transformers");
      model = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    }

    const output = await model(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
  },
};
