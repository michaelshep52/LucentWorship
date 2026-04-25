{
  "name": "Presentation",
  "table": "presentations",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Presentation row ID"
    },
    "title": {
      "type": "string",
      "description": "Presentation title"
    },
    "description": {
      "type": "string",
      "description": "Description or notes"
    },
    "date": {
      "type": "string",
      "format": "date",
      "description": "Service date"
    },
    "status": {
      "type": "string",
      "enum": [
        "draft",
        "ready",
        "archived"
      ],
      "default": "draft"
    },
    "slides": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "type": {
            "type": "string",
            "enum": [
              "lyrics",
              "scripture",
              "text",
              "blank",
              "image",
              "title"
            ]
          },
          "content": {
            "type": "string"
          },
          "subtext": {
            "type": "string"
          },
          "background_color": {
            "type": "string"
          },
          "background_image": {
            "type": "string"
          },
          "font_size": {
            "type": "string",
            "enum": [
              "small",
              "medium",
              "large",
              "xlarge"
            ]
          },
          "text_align": {
            "type": "string",
            "enum": [
              "left",
              "center",
              "right"
            ]
          },
          "song_id": {
            "type": "string"
          },
          "section_index": {
            "type": "number"
          }
        }
      },
      "description": "Ordered list of slides"
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
    "title"
  ]
}
