import { Hero } from "@/components/hero"
import { AudioLines, BarChart3Icon } from "lucide-react"
import { getTranscriptionStats } from "./actions"
import { OverviewCards } from "./components/overview-cards"
import { ProcessingBreakdownChart } from "./components/processing-breakdown-chart"
import { TranscriptionSpeedChart } from "./components/transcription-speed-chart"
import { ModelUsage } from "./components/model-usage"
import { PipelineHealth } from "./components/pipeline-health"
import { ActivityChart } from "./components/activity-chart"
import GradientIcon from "@/components/gradient-icon"

export default async function StatsPage() {
  const stats = await getTranscriptionStats()

  if (stats.overview.booksTranscribed === 0) {
    return (
      <div className="flex flex-col items-center gap-8 w-full min-h-full px-4">
        <Hero
          title="Stats"
          description={["No transcription data yet.", "Process a book to see analytics here."]}
          icon={<GradientIcon icon={<BarChart3Icon className="w-10 h-10 text-white" />} />}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full min-h-full px-4 pb-12">
      <Hero
        title="Stats"
        description={["Transcription analytics and performance metrics."]}
        icon={<GradientIcon icon={<BarChart3Icon className="w-10 h-10 text-white" />} />}
      />

      <div className="w-full max-w-5xl flex flex-col gap-6">
        <OverviewCards data={stats.overview} />
        <div className="grid gap-6 lg:grid-cols-2">
          <ProcessingBreakdownChart data={stats.processingBreakdown} />
          <TranscriptionSpeedChart data={stats.transcriptionSpeed} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ModelUsage data={stats.modelUsage} />
          <ActivityChart data={stats.activity} />
        </div>
        <PipelineHealth data={stats.pipelineHealth} />
      </div>
    </div>
  )
}
