{
  "name": "ScriptureBookmark",
  "type": "object",
  "properties": {
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
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "reference",
    "text"
  ]
}