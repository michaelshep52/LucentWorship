{
  "name": "Scripture",
  "table": "scripture",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Scripture row ID"
    },
    "reference": {
      "type": "string",
      "description": "e.g. John 3:16"
    },
    "text": {
      "type": "string",
      "description": "The scripture text"
    },
    "translation": {
      "type": "string",
      "description": "Bible translation (KJV, NIV, ESV, etc.)"
    },
    "book": {
      "type": "string",
      "description": "Bible book"
    },
    "chapter": {
      "type": "integer",
      "description": "Chapter number"
    },
    "verse_from": {
      "type": "integer",
      "description": "Starting verse"
    },
    "verse_to": {
      "type": "integer",
      "description": "Ending verse"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "created_date": {
      "type": "string",
      "format": "date-time",
      "description": "Created timestamp"
    },
    "updated_date": {
      "type": "string",
      "format": "date-time",
      "description": "Updated timestamp"
    }
  },
  "required": [
    "reference",
    "text"
  ]
}
