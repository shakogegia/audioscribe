"use client"
import { updatePushover } from "@/actions/pushover"
import { useActionState } from "react"

import { Hero } from "@/components/hero"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AppConfig } from "@/lib/config"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Label } from "@radix-ui/react-dropdown-menu"
import { ExternalLink } from "lucide-react"

export default function Pushover({ config }: { config: AppConfig }) {
  const [state, action, pending] = useActionState(updatePushover, undefined)

  return (
    <div className="flex flex-col items-center gap-8 w-full min-h-full px-4">
      <Hero
        title="Pushover"
        description={[
          "Pushover is a service that allows you to receive notifications to your phone.",
          "You can use it to receive notifications when a book is ready to be read.",
        ]}
        icon={
          <Image
            src="https://pushover.net/images/icon-512.png"
            alt="Pushover"
            width={64}
            height={64}
            className="w-16 h-16"
          />
        }
      />

      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Pushover</CardTitle>
          <CardDescription>Enter your Pushover token and user key</CardDescription>
        </CardHeader>

        <CardContent>
          <form action={action}>
            <FieldGroup>
              {state?.message && (
                <div
                  className={cn(
                    "rounded-md p-3 text-sm",
                    !state.errors ? "bg-green-500/15 text-green-500" : "bg-destructive/15 text-destructive"
                  )}
                >
                  {state.message}
                </div>
              )}
              <Field>
                {/*  */}
                <div className="flex items-center w-full">
                  <FieldLabel htmlFor="token">Token</FieldLabel>
                  <a
                    href="https://pushover.net"
                    target="_blank"
                    className="ml-auto inline-flex items-center gap-1 text-sm font-normal underline-offset-4 hover:underline"
                  >
                    Get your keys <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <Input
                  id="token"
                  placeholder="Pushover token"
                  required
                  type="password"
                  name="token"
                  defaultValue={config.pushover.token ?? ""}
                />
                {state?.errors?.token && <p className="text-sm text-destructive">{state.errors.token}</p>}
              </Field>
              <Field>
                <FieldLabel htmlFor="user">User</FieldLabel>
                <Input
                  id="user"
                  placeholder="Pushover user"
                  required
                  type="password"
                  name="user"
                  defaultValue={config.pushover.user ?? ""}
                />
                {state?.errors?.user && <p className="text-sm text-destructive">{state.errors.user}</p>}
              </Field>
              <Field>
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "Saving..." : "Save"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
