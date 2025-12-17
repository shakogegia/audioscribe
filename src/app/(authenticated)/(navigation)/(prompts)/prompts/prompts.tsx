"use client"
import { updatePrompt } from "@/actions/prompts"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useActionState } from "react"
import { type Prompt } from "@/generated/prisma"

type Props = {
  prompts: Prompt[]
}

export default function Prompts({ prompts }: Props) {
  const [state, action, pending] = useActionState(updatePrompt, undefined)
  return (
    <div className="w-full flex flex-col items-center gap-8 my-10 px-4 max-w-3xl mx-auto">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold">Prompts</h1>
        <div className="text-sm text-muted-foreground text-center max-w-3xl">
          These prompts control how the AI generates summaries, bookmark suggestions, and recaps.
          <br />
          Edit the system and user prompts to adjust the tone, format, or content.
          <br />
          Use template variables like <code className="text-xs bg-muted px-1 py-0.5 rounded">
            {"{{ transcript }}"}
          </code>{" "}
          and <code className="text-xs bg-muted px-1 py-0.5 rounded">{"{{ context.bookTitle }}"}</code> to inject
          dynamic content.
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {prompts.map(prompt => (
          <AccordionItem key={prompt.id} value={prompt.slug}>
            <AccordionTrigger>{prompt.name}</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <p className="text-sm text-muted-foreground">{prompt.description}</p>
              <form action={action} className="px-1 flex flex-col">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="system">System Prompt</FieldLabel>
                    <Textarea
                      id="system"
                      name="system"
                      defaultValue={prompt.system ?? ""}
                      placeholder="Enter your system prompt here"
                    />
                    {state?.errors?.system && <p className="text-sm text-destructive">{state.errors.system}</p>}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="prompt">User Prompt</FieldLabel>
                    <Textarea
                      id="prompt"
                      name="prompt"
                      defaultValue={prompt.prompt}
                      placeholder="Enter your prompt here"
                    />
                    {state?.errors?.prompt && <p className="text-sm text-destructive">{state.errors.prompt}</p>}
                  </Field>
                  {state?.message && (
                    <div
                      className={cn(
                        "rounded-md p-3 text-sm",
                        state?.errors ? "text-destructive bg-destructive/15" : "text-green-500 bg-green-500/15"
                      )}
                    >
                      {state.message}
                    </div>
                  )}
                  <Field>
                    <input type="hidden" name="slug" value={prompt.slug} />
                    <input type="hidden" name="name" value={prompt.name} />

                    <Button type="submit" disabled={pending}>
                      {pending ? "Updating..." : "Update"}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
