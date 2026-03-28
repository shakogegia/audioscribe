"use client"

import { signin } from "@/actions/signin"
import { useActionState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AlertCircleIcon } from "lucide-react"

export default function LoginPage() {
  const [state, action, pending] = useActionState(signin, undefined)

  return (
    <form action={action} className="flex flex-col gap-6">
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your credentials to access AudioScribe
          </p>
        </div>
        {state?.message && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" placeholder="m@example.com" required name="email" />
          {state?.errors?.email && <p className="text-sm text-destructive">{state.errors.email}</p>}
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input id="password" type="password" required name="password" />
          {state?.errors?.password && <p className="text-sm text-destructive">{state.errors.password}</p>}
        </Field>
        <Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
