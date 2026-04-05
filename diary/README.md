# Diary Folder

This is where you store your diary entries as JSON.

## How to Add Entries

Edit `index.json` and add new entries following this format:

```json
{
  "date": "YYYY-MM-DD",
  "title": "Optional Title",
  "preview": "First 100-150 characters that appears in the grid",
  "content": "Full markdown content that appears in the modal when clicked"
}
```

**Example:**

```json
[
  {
    "date": "2026-04-05",
    "title": "Stream of Thought",
    "preview": "Some fragment of a thought about the day...",
    "content": "The full stream-of-consciousness entry.\n\nWith multiple paragraphs.\n\nAnd any markdown formatting you want."
  },
  {
    "date": "2026-04-06",
    "title": "Another Day",
    "preview": "New thoughts...",
    "content": "Today I was thinking about..."
  }
]
```

## Markdown Support

Your entries support basic markdown:
- `**bold text**` for bold
- `*italic text*` for italics  
- `## Heading` for headings
- Blank lines separate paragraphs

That's it—keep it simple for stream-of-consciousness writing.
