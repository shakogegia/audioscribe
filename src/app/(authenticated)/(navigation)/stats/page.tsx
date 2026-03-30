import { Hero } from "@/components/hero"
import { BarChart3Icon } from "lucide-react"
import { getTranscriptionStats } from "./actions"
import { OverviewCards } from "./components/overview-cards"
import { ProcessingBreakdownChart } from "./components/processing-breakdown-chart"
import { TranscriptionSpeedChart } from "./components/transcription-speed-chart"
import { ModelUsage } from "./components/model-usage"
import { PipelineHealth } from "./components/pipeline-health"
import { ActivityChart } from "./components/activity-chart"

export default async function StatsPage() {
  const stats = await getTranscriptionStats()

  if (stats.overview.booksTranscribed === 0) {
    return (
      <div className="flex flex-col items-center gap-8 w-full min-h-full px-4">
        <Hero
          title="Stats"
          description={["No transcription data yet.", "Process a book to see analytics here."]}
          icon={<BarChart3Icon className="h-12 w-12 text-muted-foreground" />}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full min-h-full px-4 pb-12">
      <Hero
        title="Stats"
        description={["Transcription analytics and performance metrics."]}
        icon={<BarChart3Icon className="h-12 w-12 text-muted-foreground" />}
      />

      <div className="w-full max-w-5xl flex flex-col gap-6">
        <OverviewCards data={stats.overview} />
        <ProcessingBreakdownChart data={stats.processingBreakdown} />
        <TranscriptionSpeedChart data={stats.transcriptionSpeed} />
        <ModelUsage data={stats.modelUsage} />
        <PipelineHealth data={stats.pipelineHealth} />
        <ActivityChart data={stats.activity} />
      </div>
    </div>
  )
}
