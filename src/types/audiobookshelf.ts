/**
 * Library
 */
export interface Library {
  id: string
  name: string
  folders: Folder[]
  displayOrder: number
  icon: string
  mediaType: string
  provider: string
  settings: Settings
  createdAt: number
  lastUpdate: number
}

export interface Folder {
  id: string
  fullPath: string
  libraryId: string
  addedAt: number
}

export interface Settings {
  coverAspectRatio: number
  disableWatcher: boolean
  skipMatchingMediaWithAsin: boolean
  skipMatchingMediaWithIsbn: boolean
  autoScanCronExpression: string | null
}

/**
 * LibraryItem
 */
export interface FileMetadata {
  filename: string
  ext: string
  path: string
  relPath: string
  size: number
  mtimeMs: number
  ctimeMs: number
  birthtimeMs: number
}

export interface Author {
  id: string
  asin: string | null
  name: string
  description: string | null
  imagePath: string | null
  addedAt: number
  updatedAt: number
}

export interface Series {
  id: string
  name: string
  sequence: string
}

export interface BookMetadata {
  title: string
  titleIgnorePrefix: string
  subtitle: string | null
  authors: Author[]
  narrators: string[]
  series: Series[]
  genres: string[]
  publishedYear: string | null
  publishedDate: string | null
  publisher: string | null
  description: string | null
  isbn: string | null
  asin: string | null
  language: string | null
  explicit: boolean
  authorName: string
  authorNameLF: string
  narratorName: string
  seriesName: string
}

export interface MetaTags {
  tagAlbum?: string
  tagArtist?: string
  tagGenre?: string
  tagTitle?: string
  tagTrack?: string
  tagAlbumArtist?: string
  tagComposer?: string
}

export interface AudioFile {
  index: number
  ino: string
  metadata: FileMetadata
  addedAt: number
  updatedAt: number
  trackNumFromMeta: number | null
  discNumFromMeta: number | null
  trackNumFromFilename: number | null
  discNumFromFilename: number | null
  manuallyVerified: boolean
  exclude: boolean
  error: string | null
  format: string
  duration: number
  bitRate: number
  language: string | null
  codec: string
  timeBase: string
  channels: number
  channelLayout: string
  chapters: unknown[]
  embeddedCoverArt: string | null
  metaTags: MetaTags
  mimeType: string
}

export interface Chapter {
  id: number
  start: number
  end: number
  title: string
}

export interface Track {
  index: number
  startOffset: number
  duration: number
  title: string
  contentUrl: string
  mimeType: string
  metadata: FileMetadata
}

export interface Media {
  libraryItemId: string
  metadata: BookMetadata
  coverPath: string | null
  tags: string[]
  audioFiles: AudioFile[]
  chapters: Chapter[]
  duration: number
  size: number
  tracks: Track[]
  ebookFile: unknown | null
}

export interface LibraryFile {
  ino: string
  metadata: FileMetadata
  addedAt: number
  updatedAt: number
  fileType: string
}

export interface UserMediaProgress {
  id: string
  libraryItemId: string
  episodeId: string | null
  duration: number
  progress: number
  currentTime: number
  isFinished: boolean
  hideFromContinueListening: boolean
  lastUpdate: number
  startedAt: number
  finishedAt: number | null
}

export interface LibraryItem {
  id: string
  ino: string
  libraryId: string
  folderId: string
  path: string
  relPath: string
  isFile: boolean
  mtimeMs: number
  ctimeMs: number
  birthtimeMs: number
  addedAt: number
  updatedAt: number
  lastScan: number
  scanVersion: string
  isMissing: boolean
  isInvalid: boolean
  mediaType: string
  media: Media
  libraryFiles: LibraryFile[]
  size: number
  userMediaProgress: UserMediaProgress | null
  rssFeedUrl: string | null
}

export interface User {
  id: string
  username: string
  type: string
  token: string
  mediaProgress: UserMediaProgress[]
  seriesHideFromContinueListening: string[]
  bookmarks: AudioBookmark[]
  isActive: boolean
  isLocked: boolean
  lastSeen: number
  createdAt: number
  permissions: {
    download: boolean
    update: boolean
    delete: boolean
    upload: boolean
    accessAllLibraries: boolean
    accessAllTags: boolean
    accessExplicitContent: boolean
  }
  librariesAccessible: string[]
  itemTagsAccessible: string[]
}

export interface AudioBookmark {
  libraryItemId: string
  title: string
  time: number
  fileStartTime: number
  createdAt: number
}

export interface Session {
  id: string
  libraryItemId: string
  bookId: string
  timeListening: number
  currentTime: number
  startedAt: number
}
