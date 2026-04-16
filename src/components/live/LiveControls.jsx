import { ChevronLeft, ChevronRight, MonitorOff, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import SlidePreview from "../presentation/SlidePreview";

export default function LiveControls({
  currentIdx,
  totalSlides,
  slides,
  isBlack,
  onNext,
  onPrev,
  onGoTo,
  onBlack,
  onExit,
  presentationTitle,
}) {
  return (
    <div className="bg-gray-950 border-t border-gray-800 px-4 py-3">
      {/* Slide thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-thin">
        {slides.map((slide, idx) => (
          <button
            key={idx}
            onClick={() => onGoTo(idx)}
            className={`shrink-0 w-24 rounded border-2 transition-all ${
              idx === currentIdx ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <SlidePreview slide={slide} mini />
          </button>
        ))}
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-live/20 text-live px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-live rounded-full animate-live-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider">Live</span>
          </div>
          <span className="text-sm text-gray-400 ml-2 truncate max-w-xs">{presentationTitle}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={currentIdx === 0}
            className="border-gray-700 text-gray-300 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="text-sm text-gray-300 font-mono min-w-[60px] text-center">
            {currentIdx + 1} / {totalSlides}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={currentIdx === totalSlides - 1}
            className="border-gray-700 text-gray-300 hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isBlack ? "default" : "outline"}
            size="sm"
            onClick={onBlack}
            className={isBlack ? "" : "border-gray-700 text-gray-300 hover:text-white"}
          >
            {isBlack ? <Eye className="w-4 h-4 mr-1" /> : <MonitorOff className="w-4 h-4 mr-1" />}
            {isBlack ? "Show" : "Black"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExit}
            className="border-gray-700 text-gray-300 hover:text-white"
          >
            <X className="w-4 h-4 mr-1" /> Exit
          </Button>
        </div>
      </div>
    </div>
  );
}