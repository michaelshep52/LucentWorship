{
  "name": "Song",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Song title"
    },
    "artist": {
      "type": "string",
      "description": "Artist or author"
    },
    "key": {
      "type": "string",
      "enum": [
        "C",
        "C#",
        "D",
        "D#",
        "E",
        "F",
        "F#",
        "G",
        "G#",
        "A",
        "A#",
        "B"
      ],
      "description": "Musical key"
    },
    "tempo": {
      "type": "number",
      "description": "BPM tempo"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Tags for categorization (e.g. worship, hymn, contemporary)"
    },
    "sections": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "verse",
              "chorus",
              "bridge",
              "pre-chorus",
              "intro",
              "outro",
              "tag",
              "interlude"
            ]
          },
          "label": {
            "type": "string"
          },
          "lyrics": {
            "type": "string"
          }
        }
      },
      "description": "Song sections with lyrics"
    },
    "ccli_number": {
      "type": "string",
      "description": "CCLI license number"
    },
    "notes": {
      "type": "string",
      "description": "Internal notes"
    }
  },
  "required": [
    "title"
  ]
}