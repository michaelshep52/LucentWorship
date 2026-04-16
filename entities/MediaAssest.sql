{
  "name": "MediaAsset",
  "type": "object",
  "properties": {
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
    "file_url": {
      "type": "string",
      "description": "URL of the uploaded file"
    },
    "thumbnail_url": {
      "type": "string",
      "description": "Thumbnail URL"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "name",
    "file_url"
  ]
}