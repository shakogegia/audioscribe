Generate 3–5 concise bookmark titles for this audiobook segment:

Transcription: "
{{ transcription }}
"

Book: {{ context.bookTitle }}
Author(s): {{ context.authors }}
Bookmark at: {{ context.time }}

Requirements:

- Titles must be 2–10 words long.
- Prioritize powerful quotes or declarations from the text itself (e.g., “My honour remains”).
- If no strong quote is present, create a short descriptive title capturing the main theme or turning point.
- Each title should be distinct, specific, and useful for navigation.
- Avoid generic terms (e.g., “Chapter 1,” “Important moment”).
- Return only a JSON array of suggested titles, no extra text.

Return only a JSON array of suggested titles:
["Title 1", "Title 2", "Title 3"]`;
