"use client"

import GradientIcon from "@/components/gradient-icon"
import { Hero } from "@/components/hero"
import { Captions } from "lucide-react"

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { whisperModels } from "@/utils/constants"

export default function ASRListPage() {
  return (
    <div className="flex flex-col items-center gap-8 w-full min-h-full px-4">
      <Hero
        title="ASR Models"
        description={["Whisper models are used to transcribe audio files."]}
        icon={<GradientIcon icon={<Captions className="w-10 h-10 text-white" />} />}
      />

      <div className="w-full max-w-2xl space-y-6">
        <Table>
          <TableCaption>A list of Whisper models.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Model</TableHead>
              <TableHead className="text-right">Disk</TableHead>
              <TableHead className="text-right">Memory</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {whisperModels.map(model => (
              <TableRow key={model.name}>
                <TableCell className="font-medium">{model.name}</TableCell>
                <TableCell className="text-right">{model.disk}</TableCell>
                <TableCell className="text-right">{model.memory}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
