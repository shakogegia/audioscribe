import { StarIcon } from "lucide-react"
import useSWR from "swr"
import { twMerge } from "tailwind-merge"
import { Button } from "./ui/button"
import axios from "axios"

type Props = {
  id: string
  defaultFavorite?: boolean
}

export default function Favorite({ id, defaultFavorite }: Props) {
  const { data, mutate } = useSWR<{ favorite: boolean }>(`/api/book/${id}/favorite`, {
    revalidateOnFocus: true,
  })

  const favorite = data?.favorite ?? defaultFavorite ?? false

  const hasLoaded = typeof favorite !== "undefined"

  async function toggleFavorite() {
    await axios.post(`/api/book/${id}/favorite`, { favorite: !favorite })
    mutate({ favorite: !favorite }, { revalidate: true })
  }

  return (
    <Button variant="outline" size="sm" onClick={toggleFavorite} disabled={!hasLoaded}>
      <StarIcon className={twMerge("w-4 h-4", favorite && "text-amber-500 fill-amber-500")} />
      {favorite ? "Unfavorite" : "Favorite"}
    </Button>
  )
}
