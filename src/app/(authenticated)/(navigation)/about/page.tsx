import { Hero } from "@/components/hero"
import Logo from "@/components/logo"
import { BookHeartIcon } from "lucide-react"

// Tab - &emsp;&emsp;&emsp;

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-3xl">
      <Hero title="AudioScribe" description={[]} icon={<Logo size={128} />} />

      <div className="my-10 prose max-w-none dark:prose-invert">
        <p>
          AudioScribe is a companion app for <a href="https://www.audiobookshelf.org/">Audiobookshelf</a> that leverages
          multiple AI providers to enhance audiobook experiences through transcription, intelligent bookmarking, and
          contextual chat. Purpose of this app is to provide a way to enhance the audiobook experience by leveraging
          multiple AI providers to provide transcription, intelligent bookmarking, and contextual chat.
        </p>

        <h2>Context Retrieval</h2>
        <p>TODO: Write about context retrieval.</p>

        <p className="text-sm text-muted-foreground mt-8">
          AudioScribe is open source and licensed under the MIT License. Built with{" "}
          <BookHeartIcon className="w-4 h-4 inline-block" /> for the audiobook community.
        </p>
      </div>
    </div>
  )
}
