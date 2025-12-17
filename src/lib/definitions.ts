import * as z from "zod"

export const SigninFormSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }).trim(),
  password: z
    .string()
    .min(1, { error: "Password is required" })
    .max(100, { error: "Password must be less than 100 characters" })
    .trim(),
})

export type SigninFormState =
  | {
      errors?: {
        email?: string[]
        password?: string[]
      }
      message?: string
    }
  | undefined

export const PushoverFormSchema = z.object({
  token: z.string().min(1, { error: "Token is required" }).trim(),
  user: z.string().min(1, { error: "User is required" }).trim(),
})

export type PushoverFormState =
  | {
      errors?: {
        token?: string[]
        user?: string[]
      }
      message?: string
    }
  | undefined

export type SessionPayload = {
  userId: string
  expiresAt: Date
}

export const PromptFormSchema = z.object({
  slug: z.string().min(1, { error: "Slug is required" }).trim(),
  name: z.string().min(1, { error: "Name is required" }).trim(),
  prompt: z.string().min(1, { error: "Prompt is required" }).trim(),
  system: z.string().optional(),
})

export type PromptFormState =
  | {
      errors?: {
        slug?: string[]
        name?: string[]
        prompt?: string[]
        system?: string[]
      }
      message?: string
    }
  | undefined
