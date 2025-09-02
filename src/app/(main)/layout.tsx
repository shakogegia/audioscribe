import { load } from "@/lib/config";
import { redirect } from "next/navigation";


type Props = Readonly<{
  children: React.ReactNode;
}>;

export default async function MainLayout({ children, }: Props) {
	const config = await load();
	
	if (!config.audiobookshelf.url || !config.audiobookshelf.apiKey) {
		return redirect("/setup/audiobookshelf");
	}

	const aiProviders = Object.values(config.aiProviders).filter(provider => provider.enabled);
	if (aiProviders.length === 0) {
		return redirect("/setup/llm");
	}

  return <div>halllo{children}</div>;
}
