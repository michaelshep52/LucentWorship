{
  "name": "Media",
  "table": "media",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Media row ID"
    },
    "name": {
      "type": "string",
      "description": "Asset name"
    },
    "type": {
      "type": "string",
      "enum": [
        "image",
        "video",
        "background"
      ],
      "description": "Asset type"
    },
    "url": {
      "type": "string",
      "format": "uri",
      "description": "URL of the uploaded file"
    },
    "size": {
      "type": "integer",
      "description": "File size in bytes"
    },
    "created_date": {
      "type": "string",
      "format": "date-time",
      "description": "Created timestamp"
    }
  },
  "required": [
    "name",
    "url"
  ]
}
