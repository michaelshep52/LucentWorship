import { PRESENTATION_FONT_PX } from "@/lib/presentation-slides";

export default function SlidePreview({ slide, mini = false }) {
    const fontSizeMap = {
      small: mini ? "text-[6px]" : "text-lg",
      medium: mini ? "text-[8px]" : "text-2xl",
      large: mini ? "text-[10px]" : "text-4xl",
      xlarge: mini ? "text-[12px]" : "text-5xl",
    };
  
    const alignMap = {
      left: "text-left items-start",
      center: "text-center items-center",
      right: "text-right items-end",
    };
  
    const fontSize = fontSizeMap[slide.font_size] || fontSizeMap.large;
    const align = alignMap[slide.text_align] || alignMap.center;
    const contentFontStyle = !mini ? { fontSize: `${slide.font_px || PRESENTATION_FONT_PX}px` } : undefined;
  
    return (
      <div
        className={`relative rounded-lg overflow-hidden ${mini ? "aspect-video" : "aspect-video"}`}
        style={{
          backgroundColor: slide.background_color || "#0f172a",
          backgroundImage: slide.background_image ? `url(${slide.background_image})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {slide.background_image && (
          <div className="absolute inset-0 bg-black/40" />
        )}
        <div className={`relative h-full flex flex-col justify-center ${align} ${mini ? "p-2" : "p-8 md:p-16"}`}>
          {slide.type === "title" ? (
            <>
              <p className={`font-bold text-white leading-tight ${mini ? "text-[10px]" : "text-4xl md:text-5xl"}`}>
                {slide.content || (mini ? "" : "Title")}
              </p>
              {slide.subtext && (
                <p className={`text-white/70 mt-2 ${mini ? "text-[6px]" : "text-lg"}`}>
                  {slide.subtext}
                </p>
              )}
            </>
          ) : (
            <>
              <p className={`font-semibold text-white leading-relaxed whitespace-pre-line ${fontSize}`} style={contentFontStyle}>
                {slide.content || (mini ? "" : "Slide content")}
              </p>
              {slide.subtext && (
                <p className={`text-white/60 mt-3 ${mini ? "text-[5px]" : "text-sm"}`}>
                  {slide.subtext}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
