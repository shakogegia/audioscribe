import fs from "fs/promises";
import { join } from "path";

export interface AppConfig {
  audiobookshelf: { url: string | null; apiKey: string | null };
  aiProviders: {
    openai: { enabled: boolean; apiKey: string | null };
    google: { enabled: boolean; apiKey: string | null };
    claude: { enabled: boolean; apiKey: string | null };
    ollama: { enabled: boolean; baseUrl: string | null };
  };
}

export const defaultConfig: AppConfig = {
  audiobookshelf: { url: null, apiKey: null },
  aiProviders: {
    openai: { enabled: false, apiKey: null },
    google: { enabled: false, apiKey: null },
    claude: { enabled: false, apiKey: null },
    ollama: { enabled: false, baseUrl: null },
  },
};

const configPath = join(process.cwd(), "config.json");

export async function save(config: AppConfig) {
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

export async function load(): Promise<AppConfig | null> {
  try {
    const configExists = await fs
      .access(configPath)
      .then(() => true)
      .catch(() => false);

    if (!configExists) {
      return defaultConfig;
    }

    const config = await fs.readFile(configPath, "utf8");
    const parsedConfig = JSON.parse(config);
    return { ...defaultConfig, ...parsedConfig };
  } catch {
    return null;
  }
}
