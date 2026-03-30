# Transcription Stats Page — Design Spec

## Overview

A dedicated `/stats` page providing analytics on transcription performance, model usage, pipeline health, and processing activity. All data is computed server-side from existing database tables (`Job`, `AudioChunk`, `TranscriptSegment`, `Book`). One minor addition to the Python worker stores `compute_type` in job metadata.

## Route & Navigation

- **Route**: `/stats` under the `(authenticated)/(navigation)` layout group
- **Navigation**: Add "Stats" link to the nav menu dropdown, in a new "Analytics" group above "Configuration"
- **Layout**: Single scrollable page, no tabs needed

## UI Components

Uses shadcn/ui `chart` component (Recharts wrapper) plus existing `card` component.

## Sections

### 1. Overview Cards

Four stat cards in a responsive grid (2x2 on mobile, 4x1 on desktop).

| Card | Value | Computation |
|------|-------|-------------|
| Books Transcribed | Count | `Book WHERE transcribed = true` |
| Audio Hours Processed | `Xh Ym` | `SUM(AudioChunk.duration)` converted to hours |
| Median Processing Speed | `Xh audio in Ym` | Median RTF across all books × 1 hour |
| Success Rate | `X%` | `completed jobs / (completed + failed jobs)` for Transcribe type |

### 2. Processing Time Breakdown (Stacked Bar Chart)

- **Chart type**: Horizontal stacked bar (`chart-bar-stacked`)
- **X-axis**: Book title (fetched from Audiobookshelf API or book ID)
- **Stacked segments**: Download (blue), PrepareAudio (amber), Transcribe (green)
- **Value**: Duration in minutes, computed from `Job.completedAt - Job.startedAt` per type per book
- **For Transcribe**: Sum across all chunk jobs for the book
- **Sort**: Most recently processed first
- **Limit**: Last 20 books (pagination not needed initially)

### 3. Transcription Speed / RTF (Bar Chart)

- **Chart type**: Horizontal bar chart (`chart-bar-horizontal`)
- **Metric**: Real-Time Factor (RTF) = `audio_duration / processing_time`
  - `audio_duration`: `SUM(AudioChunk.duration)` for the book
  - `processing_time`: `SUM(completedAt - startedAt)` across all Transcribe jobs for the book
- **RTF interpretation**: RTF of 5 means "5 hours of audio transcribed in 1 hour"
- **Color**: By whisper model used (from Job.metadata JSON)
- **Sort**: By RTF descending (fastest first)
- **Reference line**: RTF = 1 (real-time boundary)
- **Limit**: Last 20 books

### 4. Model Usage (Donut Chart + Comparison)

Two side-by-side components:

**Donut chart** (`chart-pie-donut`):
- Segments by whisper model name
- Value = number of books processed with that model

**Model comparison table**:
| Model | Books | Avg RTF | Median RTF | Total Hours |
|-------|-------|---------|------------|-------------|

- Data from `TranscriptSegment.model` grouped, cross-referenced with Job timing data

### 5. Pipeline Health

Three sub-components:

**Failure rate by stage** (small bar chart):
- Three bars: Download, PrepareAudio, Transcribe
- Value: `failed_jobs / total_jobs` as percentage

**Retry distribution** (simple stat or small chart):
- Count of jobs with `attempts > 1`, grouped by attempt count
- E.g., "12 jobs needed 1 retry, 3 jobs needed 2 retries"

**Recent errors table**:
- Last 10 failed jobs
- Columns: Book, Stage, Error message (truncated), Time
- Uses shadcn `table` component

### 6. Activity Over Time (Area Chart)

- **Chart type**: Area chart (`chart-area-default`)
- **X-axis**: Month
- **Y-axis (primary)**: Number of books processed
- **Y-axis (secondary)**: Cumulative audio hours
- **Grouping**: By month (or week if < 3 months of data)

## API

Single server action or API route that returns all stats data in one request:

```typescript
// src/app/(authenticated)/(navigation)/stats/actions.ts
async function getTranscriptionStats(): Promise<StatsData>
```

**`StatsData` shape**:
```typescript
interface StatsData {
  overview: {
    booksTranscribed: number
    audioHoursProcessed: number
    medianRtf: number
    successRate: number
  }
  processingBreakdown: Array<{
    bookId: string
    bookTitle: string
    download: number    // minutes
    prepare: number     // minutes
    transcribe: number  // minutes
  }>
  transcriptionSpeed: Array<{
    bookId: string
    bookTitle: string
    rtf: number
    model: string
    audioDuration: number  // minutes
    processingTime: number // minutes
  }>
  modelUsage: Array<{
    model: string
    bookCount: number
    avgRtf: number
    medianRtf: number
    totalHours: number
  }>
  pipelineHealth: {
    failureRates: Array<{ stage: string; rate: number; total: number; failed: number }>
    retryDistribution: Array<{ attempts: number; count: number }>
    recentErrors: Array<{
      bookId: string
      stage: string
      error: string
      timestamp: string
    }>
  }
  activity: Array<{
    period: string      // "2026-03" or "2026-W13"
    booksProcessed: number
    audioHours: number
  }>
}
```

## Book Titles

Book titles are not stored in the local DB — they come from Audiobookshelf. The stats action will fetch titles via the existing Audiobookshelf API client (`src/lib/audiobookshelf.ts`), using the book IDs. Cache or batch these calls to avoid N+1.

## Worker Change

In `scripts/lib/transcribe.py`, add `compute_type` to the metadata JSON stored on the Job when transcription starts:

```python
metadata = {
    "model": model_name,
    "compute_type": compute_type
}
```

This is a non-breaking addition — the metadata field is already a JSON string, and existing jobs without `compute_type` are handled gracefully (shown as "unknown").

## File Structure

```
src/app/(authenticated)/(navigation)/stats/
  page.tsx          # Server component, fetches data, renders sections
  actions.ts        # Server action: getTranscriptionStats()
  components/
    overview-cards.tsx
    processing-breakdown-chart.tsx
    transcription-speed-chart.tsx
    model-usage.tsx
    pipeline-health.tsx
    activity-chart.tsx
```

## Dependencies

- `shadcn/ui chart` component (to be installed via `pnpm dlx shadcn@latest add chart`)
- `recharts` (installed as peer dependency of chart component)
- Existing: `card`, `table` from shadcn/ui

## Edge Cases

- **No data**: Show an empty state with a message like "No transcription data yet. Process a book to see stats."
- **Partial data**: If a book has no AudioChunks (incomplete pipeline), exclude from RTF calculations
- **Missing book titles**: Fall back to displaying the book ID
- **Jobs with no timestamps**: Exclude from timing calculations (shouldn't happen, but defensive)
- **Single book**: All charts still render meaningfully with one data point
