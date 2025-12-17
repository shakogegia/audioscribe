import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default async function EndpointsPage() {
  return (
    <div className="w-full flex flex-col items-center gap-8 my-10 px-4 max-w-3xl mx-auto">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold">Endpoints</h1>
        <div className="text-sm text-muted-foreground text-center max-w-md">
          Use these endpoints to integrate Audioscribe into your iOS app.
          <br />
          <span className="text-sm text-muted-foreground">
            All endpoints require a <code>secret</code> parameter to authenticate the request,
            <code>provider</code> parameter to specify the AI provider, and a <code>model</code> parameter to specify
            the AI model.
          </span>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="previously-on">
          <AccordionTrigger>Previously on</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 text-balance">
            <p>
              Endpoint: <code>/api/ios/previously-on</code>
            </p>
            <p>Generate a summary of the last 10 minutes of the audiobook.</p>
            <div>
              Parameters:
              <ul className="prose">
                <li>
                  <code>provider</code>: The AI provider to use. Example: <code>google</code>
                </li>
                <li>
                  <code>model</code>: The AI model to use. Example: <code>gemini-2.5-pro</code> or{" "}
                  <code>gemini-2.5-flash</code>.
                </li>
                <li>
                  <code>secret</code>: The secret key to authenticate the request.
                </li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="chapter-summary">
          <AccordionTrigger>Chapter summary</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 text-balance">
            <p>
              Endpoint: <code>/api/ios/summary/chapter</code>
            </p>
            <p>Generates a summary of the current or previous chapter of the audiobook.</p>
            <div>
              Parameters:
              <ul className="prose">
                <li>
                  <code>chapter</code>: The chapter to generate a summary for. Example: <code>current</code> or{" "}
                  <code>previous</code>.
                </li>
                <li>
                  <code>provider</code>: The AI provider to use. Example: <code>google</code>
                </li>
                <li>
                  <code>model</code>: The AI model to use. Example: <code>gemini-2.5-pro</code> or{" "}
                  <code>gemini-2.5-flash</code>.
                </li>
                <li>
                  <code>secret</code>: The secret key to authenticate the request.
                </li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
