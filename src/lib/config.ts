import fs from "fs/promises";
import { join } from "path";

export interface AppConfig {
  audiobookshelf: { url: string | null; apiKey: string | null };
  aiProviders: {
    openai: { enabled: boolean; apiKey: string | null };
    google: { enabled: boolean; apiKey: string | null };
    anthropic: { enabled: boolean; apiKey: string | null };
    ollama: { enabled: boolean; baseUrl: string | null };
  };
}

export const defaultConfig: AppConfig = {
  audiobookshelf: { url: null, apiKey: null },
  aiProviders: {
    openai: { enabled: false, apiKey: null },
    google: { enabled: false, apiKey: null },
    anthropic: { enabled: false, apiKey: null },
    ollama: { enabled: false, baseUrl: null },
  },
};

const configPath = join(process.env.DATA_DIR!, "config.json");

export async function load(): Promise<AppConfig> {
  try {
    const configExists = await fs
      .access(configPath)
      .then(() => true)
      .catch(() => false);

    if (!configExists) {
      console.log("Config file doesn't exist, returning default config");
      return defaultConfig;
    }

    const config = await fs.readFile(configPath, "utf8");
    const parsedConfig = JSON.parse(config);
    return { ...defaultConfig, ...parsedConfig };
  } catch (error) {
    console.error("Failed to load config, returning default config:", error);
    return defaultConfig;
  }
}

export async function save(config: AppConfig) {
  try {
    // Ensure data directory exists
    const dataDir = join(process.cwd(), "data");
    await fs.mkdir(dataDir, { recursive: true });

    // Save config file
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to save config:", error);
    throw error;
  }
}
