"use client";

import GradientIcon from "@/components/gradient-icon";
import { Hero } from "@/components/hero";
import { Captions } from "lucide-react";

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const models = [
  {
    name: "tiny",
    disk: "75 MB",
    memory: "~390 MB",
  },
  {
    name: "tiny.en",
    disk: "75 MB",
    memory: "~390 MB",
  },
  {
    name: "base",
    disk: "142 MB",
    memory: "~500 MB",
  },
  {
    name: "base.en",
    disk: "142 MB",
    memory: "~500 MB",
  },
  {
    name: "small",
    disk: "466 MB",
    memory: "~1.0 GB",
  },
  {
    name: "small.en",
    disk: "466 MB",
    memory: "~1.0 GB",
  },
  {
    name: "medium",
    disk: "1.5 GB",
    memory: "~2.6 GB",
  },
  {
    name: "medium.en",
    disk: "1.5 GB",
    memory: "~2.6 GB",
  },
  {
    name: "large-v1",
    disk: "2.9 GB",
    memory: "~4.7 GB",
  },
  {
    name: "large",
    disk: "2.9 GB",
    memory: "~4.7 GB",
  },
  {
    name: "large-v3-turbo",
    disk: "1.5 GB",
    memory: "~2.6 GB",
  },
];

export default function LLMSetupPage() {
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
            {models.map(model => (
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
  );
}
