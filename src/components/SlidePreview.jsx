export default function SlidePreview({ slide, small = false }) {
    if (!slide) return null;
  
    const bgStyle = slide.background_image
      ? { backgroundImage: `url(${slide.background_image})`, backgroundSize: "cover", backgroundPosition: "center" }
      : { backgroundColor: slide.background_color || "#000000" };
  
    const fontSizes = {
      small: small ? "text-xs" : "text-xl",
      medium: small ? "text-xs" : "text-3xl",
      large: small ? "text-sm" : "text-5xl",
      xlarge: small ? "text-sm" : "text-7xl",
    };
  
    const alignClass = {
      left: "text-left items-start",
      center: "text-center items-center",
      right: "text-right items-end",
    }[slide.text_align || "center"] || "text-center items-center";
  
    return (
      <div
        className="w-full h-full rounded-lg overflow-hidden flex flex-col justify-center relative"
        style={bgStyle}
      >
        {/* Overlay for readability */}
        {(slide.content || slide.type === "blank") && (
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />
        )}
        <div className={`relative z-10 flex flex-col px-${small ? "2" : "8"} py-4 w-full ${alignClass}`}>
          {slide.type === "blank" ? null : (
            <>
              {slide.content && (
                <p className={`text-white font-semibold leading-snug whitespace-pre-wrap ${fontSizes[slide.font_size || "large"]}`}>
                  {slide.content}
                </p>
              )}
              {slide.subtext && (
                <p className={`text-white/70 mt-1 ${small ? "text-xs" : "text-lg"}`}>
                  {slide.subtext}
                </p>
              )}
              {!slide.content && !slide.subtext && (
                <p className={`text-white/20 ${small ? "text-xs" : "text-xl"}`}>
                  {slide.type || "Empty slide"}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    );
  }