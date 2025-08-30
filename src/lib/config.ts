import fs from "fs/promises";
import { join } from "path";

export interface AppConfig {
  audiobookshelf: {
    url: string;
    apiKey: string;
  };
}

const defaultConfig: AppConfig = {
  audiobookshelf: {
    url: "",
    apiKey: "",
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
