import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Presentation } from "@/api/entities";
import { motion, AnimatePresence } from "framer-motion";
import { PRESENTATION_FONT_PX } from "@/lib/presentation-slides";
import LiveControls from "../components/live/LiveControls";

export default function LivePresentation() {
  const navigate = useNavigate();
  const presId = window.location.pathname.split("/live/")[1];

  const [presentation, setPresentation] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isBlack, setIsBlack] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Presentation.filter({ id: presId }).then((data) => {
      if (data.length > 0) setPresentation(data[0]);
      setLoading(false);
    });
  }, [presId]);

  const slides = presentation?.slides || [];
  const currentSlide = slides[currentIdx];

  const goNext = useCallback(() => {
    if (currentIdx < slides.length - 1) {
      setCurrentIdx((i) => i + 1);
      setIsBlack(false);
    }
  }, [currentIdx, slides.length]);

  const goPrev = useCallback(() => {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
      setIsBlack(false);
    }
  }, [currentIdx]);

  const toggleBlack = useCallback(() => setIsBlack((b) => !b), []);

  // Keyboard controls
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "b" || e.key === "B" || e.key === ".") {
        toggleBlack();
      } else if (e.key === "Escape") {
        navigate(`/presentations/${presId}`);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, toggleBlack, navigate, presId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-800 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!presentation || slides.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white">
        <p>No slides to present</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Main display */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {isBlack ? (
            <motion.div
              key="black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black"
            />
          ) : (
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0"
              style={{
                backgroundColor: currentSlide?.background_color || "#0f172a",
                backgroundImage: currentSlide?.background_image
                  ? `url(${currentSlide.background_image})`
                  : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {currentSlide?.background_image && (
                <div className="absolute inset-0 bg-black/40" />
              )}
              <div
                className={`relative h-full flex flex-col justify-center px-16 md:px-32 ${
                  currentSlide?.text_align === "left"
                    ? "items-start text-left"
                    : currentSlide?.text_align === "right"
                    ? "items-end text-right"
                    : "items-center text-center"
                }`}
              >
                <LiveSlideContent slide={currentSlide} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <LiveControls
        currentIdx={currentIdx}
        totalSlides={slides.length}
        slides={slides}
        isBlack={isBlack}
        onNext={goNext}
        onPrev={goPrev}
        onGoTo={(idx) => { setCurrentIdx(idx); setIsBlack(false); }}
        onBlack={toggleBlack}
        onExit={() => navigate(`/presentations/${presId}`)}
        presentationTitle={presentation.title}
      />
    </div>
  );
}

function LiveSlideContent({ slide }) {
  const sizeMap = {
    small: "text-2xl md:text-3xl",
    medium: "text-3xl md:text-4xl",
    large: "text-4xl md:text-6xl",
    xlarge: "text-5xl md:text-7xl",
  };

  const fontSize = sizeMap[slide?.font_size] || sizeMap.large;
  const contentFontStyle = { fontSize: `${slide?.font_px || PRESENTATION_FONT_PX}px` };

  if (slide?.type === "title") {
    return (
      <>
        <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight max-w-4xl">
          {slide.content}
        </h1>
        {slide.subtext && (
          <p className="text-xl md:text-2xl text-white/70 mt-4">{slide.subtext}</p>
        )}
      </>
    );
  }

  return (
    <>
      <p className={`font-semibold text-white leading-relaxed whitespace-pre-line max-w-4xl ${fontSize}`} style={contentFontStyle}>
        {slide?.content}
      </p>
      {slide?.subtext && (
        <p className="text-sm md:text-base text-white/50 mt-6">{slide.subtext}</p>
      )}
    </>
  );
}
