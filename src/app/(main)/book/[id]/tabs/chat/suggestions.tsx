import { BookmarkIcon, BookmarkPlusIcon, BookOpenIcon, TimerResetIcon } from "lucide-react"

export const suggestionIcons: React.ReactNode[] = [
  <TimerResetIcon key="timer-reset" />,
  <BookmarkIcon key="bookmark" />,
  <BookmarkPlusIcon key="bookmark-plus" />,
  <BookOpenIcon key="book-open" />,
]

export const suggestions = [
  "Recap the last 10 minutes",
  "What happened in the last chapter?",
  "What's coming up in the next chapter?",
  "What is this book about?",
]
