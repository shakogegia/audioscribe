"use server"

import { load } from "@/lib/config"
import { SigninFormSchema, SigninFormState } from "@/lib/definitions"
import { createSession } from "@/lib/session"
import { redirect } from "next/navigation"

export async function signin(state: SigninFormState, formData: FormData) {
  // Validate form fields
  const validatedFields = SigninFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors as {
        email?: string[]
        password?: string[]
      },
    }
  }

  const { email, password } = validatedFields.data

  // Validate against environment variables
  const validEmail = process.env.AUTH_EMAIL
  const validPassword = process.env.AUTH_PASSWORD

  if (!validEmail || !validPassword) {
    return {
      message: "Authentication not configured. Please set AUTH_EMAIL and AUTH_PASSWORD environment variables.",
    }
  }

  if (email !== validEmail || password !== validPassword) {
    return {
      message: "Invalid email or password.",
    }
  }

  // Create user session
  await createSession(email)

  // Redirect user to home
  const config = await load()

  const isAudiobookshelfConfigured = Object.values(config.audiobookshelf).every(value => Boolean(value))
  if (!isAudiobookshelfConfigured) {
    return redirect("/setup/audiobookshelf")
  }

  const aiProviders = Object.values(config.aiProviders).filter(provider => provider.enabled)
  if (aiProviders.length === 0) {
    return redirect("/setup/llm")
  }

  redirect("/home")
}
