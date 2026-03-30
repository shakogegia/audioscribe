import { BookOpenIcon, ClockIcon, GaugeIcon, ShieldCheckIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { StatsData } from "../actions"

interface OverviewCardsProps {
  data: StatsData["overview"]
}

export function OverviewCards({ data }: OverviewCardsProps) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <Card size="sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Books Transcribed</CardTitle>
          <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.booksTranscribed}</div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Audio Hours Processed</CardTitle>
          <ClockIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.audioHoursProcessed}h</div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Median Speed (RTF)</CardTitle>
          <GaugeIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.medianRtf}x</div>
          {data.medianRtf > 0 && (
            <CardDescription>
              1h audio in {Math.round(60 / data.medianRtf)}min
            </CardDescription>
          )}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <ShieldCheckIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.successRate}%</div>
        </CardContent>
      </Card>
    </div>
  )
}
