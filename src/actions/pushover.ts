"use server"
import { load, save } from "@/lib/config"
import { PushoverFormSchema, PushoverFormState } from "@/lib/definitions"

export async function updatePushover(state: PushoverFormState, formData: FormData) {
  // await save(config)
  const validatedFields = PushoverFormSchema.safeParse({
    token: formData.get("token"),
    user: formData.get("user"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors as {
        token?: string[]
        user?: string[]
      },
    }
  }

  const { token, user } = validatedFields.data

  const config = await load()

  config.pushover = {
    token,
    user,
  }

  await save(config)

  return {
    message: "Pushover configuration saved",
  }
}
