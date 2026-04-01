"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { StatsData } from "../actions"
import { formatDuration } from "./format-duration"

interface EstimateWithModelProps {
  data: StatsData["modelUsage"]
  medianBookAudioMinutes: number
}

export function EstimateWithModel({ data, medianBookAudioMinutes }: EstimateWithModelProps) {
  if (data.length === 0) return null

  const [selectedModel, setSelectedModel] = useState(data[0]?.model ?? "")
  const selectedRow = data.find(row => row.model === selectedModel) ?? data[0]

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Estimate With Model</CardTitle>
        <CardDescription>Predict how long conversion takes based on observed model speed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Select model</div>
          <Select value={selectedRow.model} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {data.map(row => (
                  <SelectItem key={row.model} value={row.model}>
                    {row.model}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          Typical tracked book length: {formatDuration(medianBookAudioMinutes)}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-background/80 p-4">
            <div className="text-xs text-muted-foreground">Typical book</div>
            <div className="mt-1 text-2xl font-semibold">{formatDuration(selectedRow.estimatedMedianBookMinutes)}</div>
            <div className="mt-1 text-xs text-muted-foreground">Estimated conversion time</div>
          </div>
          <div className="rounded-lg border bg-background/80 p-4">
            <div className="text-xs text-muted-foreground">1h audio</div>
            <div className="mt-1 text-2xl font-semibold">{formatDuration(selectedRow.minutesPerAudioHour)}</div>
            <div className="mt-1 text-xs text-muted-foreground">Expected transcription time</div>
          </div>
        </div>

        <div className="rounded-lg bg-muted/30 px-3 py-1 text-sm text-muted-foreground">
          Based on {selectedRow.bookCount} completed book{selectedRow.bookCount === 1 ? "" : "s"} with this model at an
          average speed of {selectedRow.avgRtf}x.
        </div>
      </CardContent>
    </Card>
  )
}
