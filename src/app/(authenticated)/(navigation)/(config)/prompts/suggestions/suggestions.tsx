"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { ChatQuickQuestion } from "../../../../../../../generated/prisma"
import { TrainIcon, TrashIcon } from "lucide-react"
import { toast } from "sonner"

export default function Suggestions({
  initialSuggestions,
  updateSuggestions,
}: {
  initialSuggestions: ChatQuickQuestion[]
  updateSuggestions: (suggestions: ChatQuickQuestion[]) => void
}) {
  const [suggestions, setSuggestions] = useState(initialSuggestions)

  async function handleDeleteSuggestion(id: string) {
    const newSuggestions = suggestions.filter(suggestion => suggestion.id !== id)
    setSuggestions(newSuggestions)
    await updateSuggestions(newSuggestions)
    toast.success("Suggestion deleted")
  }

  async function addSuggestion() {
    const newSuggestion: ChatQuickQuestion = {
      id: crypto.randomUUID(),
      question: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setSuggestions([...suggestions, newSuggestion])
  }

  async function saveSuggestions() {
    await updateSuggestions(suggestions)
    toast.success("Suggestions saved")
  }

  function updateSuggestion(id: string, question: string) {
    const newSuggestions = suggestions.map(suggestion =>
      suggestion.id === id ? { ...suggestion, question } : suggestion
    )
    setSuggestions(newSuggestions)
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full min-h-full px-4 max-w-xl mx-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Suggestions</CardTitle>
          <CardDescription>Quick questions for the chat prompt.</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-4 divide-y divide-gray-200">
            {suggestions.map(suggestion => (
              <div className="pb-4 flex items-center justify-between gap-2 group" key={suggestion.id}>
                <input
                  className="text-left text-sm font-medium w-full"
                  type="text"
                  defaultValue={suggestion.question}
                  placeholder="Enter a question"
                  onChange={e => updateSuggestion(suggestion.id, e.target.value)}
                />
                <TrashIcon
                  className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteSuggestion(suggestion.id)}
                />
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button onClick={saveSuggestions}>Save Suggestions</Button>
          <Button variant="outline" onClick={addSuggestion}>
            Add Question
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
