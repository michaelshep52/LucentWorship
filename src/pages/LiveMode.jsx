import { useState, useEffect, useCallback, useRef } from "react";
import { Presentation } from "@/api/entities";
import { ChevronLeft, ChevronRight, Radio, Eye, EyeOff, Monitor, Timer, X, Grid, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SlidePreview from "../components/SlidePreview";

export default function LiveMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const presentationId = urlParams.get("presentation");

  const [presentations, setPresentations] = useState([]);
  const [selected, setSelected] = useState(presentationId || "");
  const [presentation, setPresentation] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isBlack, setIsBlack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [presenterView, setPresenterView] = useState(false);

  // Countdown
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownMinutes, setCountdownMinutes] = useState(5);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownRemaining, setCountdownRemaining] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    Presentation.list().then(data => {
      setPresentations(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selected) loadPresentation(selected);
  }, [selected]);

  async function loadPresentation(id) {
    const data = await Presentation.filter({ id });
    if (data?.[0]) { setPresentation(data[0]); setCurrentIndex(0); }
  }

  const slides = presentation?.slides || [];
  const currentSlide = slides[currentIndex];

  const go = useCallback((dir) => {
    setCurrentIndex(i => {
      const next = i + dir;
      if (next < 0 || next >= slides.length) return i;
      return next;
    });
    setIsBlack(false);
  }, [slides.length]);

  useEffect(() => {
    function handleKey(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") go(1);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(-1);
      if (e.key === "b" || e.key === "B") setIsBlack(b => !b);
      if (e.key === "Escape") setIsBlack(false);
      if (e.key === "p" || e.key === "P") setPresenterView(v => !v);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [go]);

  // Countdown logic
  function startCountdown() {
    const total = (countdownMinutes * 60) + countdownSeconds;
    setCountdownRemaining(total);
    setCountdownActive(true);
    intervalRef.current = setInterval(() => {
      setCountdownRemaining(r => {
        if (r <= 1) { clearInterval(intervalRef.current); setCountdownActive(false); return 0; }
        return r - 1;
      });
    }, 1000);
  }

  function stopCountdown() {
    clearInterval(intervalRef.current);
    setCountdownActive(false);
    setCountdownRemaining(0);
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-semibold text-foreground">Live Mode</span>
        </div>
        <select value={selected} onChange={e => setSelected(e.target.value)}
          className="flex-1 max-w-xs px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="">Select Presentation...</option>
          {presentations.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>

        <div className="ml-auto flex items-center gap-2">
          {/* Countdown toggle */}
          <button onClick={() => setShowCountdown(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showCountdown ? "bg-primary/20 text-primary" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
            <Timer className="w-4 h-4" />
            {countdownActive ? formatTime(countdownRemaining) : "Timer"}
          </button>

          {/* Presenter view */}
          <button onClick={() => setPresenterView(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${presenterView ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
            <Grid className="w-4 h-4" />
            Presenter View
          </button>

          <button onClick={() => setIsBlack(b => !b)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isBlack ? "bg-white text-black" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
            {isBlack ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {isBlack ? "Unblank" : "Blank"}
          </button>
        </div>
      </div>

      {/* Countdown Panel */}
      {showCountdown && (
        <div className="flex items-center gap-4 px-5 py-3 bg-card/50 border-b border-border flex-shrink-0">
          <Timer className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <input type="number" min={0} max={99} value={countdownMinutes} onChange={e => setCountdownMinutes(Number(e.target.value))}
              disabled={countdownActive}
              className="w-16 px-2 py-1 bg-background border border-border rounded text-sm text-center text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <span className="text-muted-foreground">min</span>
            <input type="number" min={0} max={59} value={countdownSeconds} onChange={e => setCountdownSeconds(Number(e.target.value))}
              disabled={countdownActive}
              className="w-16 px-2 py-1 bg-background border border-border rounded text-sm text-center text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <span className="text-muted-foreground">sec</span>
          </div>
          {countdownActive ? (
            <>
              <span className="text-2xl font-mono font-bold text-primary">{formatTime(countdownRemaining)}</span>
              <button onClick={stopCountdown} className="px-3 py-1 bg-destructive/20 text-destructive rounded text-sm hover:bg-destructive/30 transition-colors">Stop</button>
            </>
          ) : (
            <button onClick={startCountdown}
              className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              Start
            </button>
          )}
        </div>
      )}

      {/* Main Body */}
      {presenterView ? (
        // PRESENTER VIEW: all slides grid + current slide preview
        <div className="flex flex-1 overflow-hidden">
          {/* Current slide large preview */}
          <div className="flex-1 flex flex-col bg-black">
            <div className="flex-1 flex items-center justify-center relative p-4">
              <AnimatePresence mode="wait">
                {isBlack ? (
                  <motion.div key="black" className="absolute inset-0 bg-black"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                ) : currentSlide ? (
                  <motion.div key={currentIndex} className="w-full h-full"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}>
                    <SlidePreview slide={currentSlide} />
                  </motion.div>
                ) : (
                  <p className="text-white/20 text-sm">No slide selected</p>
                )}
              </AnimatePresence>
              {slides.length > 0 && (
                <div className="absolute bottom-3 right-3 text-white/40 text-xs font-mono bg-black/40 px-2 py-1 rounded">
                  {currentIndex + 1} / {slides.length}
                </div>
              )}
            </div>
            {/* Next slide preview */}
            {slides[currentIndex + 1] && (
              <div className="h-24 bg-black/80 border-t border-white/10 flex items-center px-4 gap-3">
                <span className="text-white/40 text-xs">NEXT</span>
                <div className="h-16 aspect-video rounded overflow-hidden border border-white/10">
                  <SlidePreview slide={slides[currentIndex + 1]} small />
                </div>
                <p className="text-white/50 text-xs truncate max-w-xs">{slides[currentIndex + 1].content?.slice(0, 60)}</p>
              </div>
            )}
          </div>

          {/* All slides panel */}
          <div className="w-64 bg-card border-l border-border overflow-auto">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 sticky top-0 bg-card border-b border-border">All Slides ({slides.length})</p>
            <div className="p-2 space-y-1.5">
              {slides.map((slide, i) => (
                <div key={slide.id || i} onClick={() => { setCurrentIndex(i); setIsBlack(false); }}
                  className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${currentIndex === i ? "border-primary" : "border-transparent hover:border-primary/30"}`}>
                  <div className="aspect-video">
                    <SlidePreview slide={slide} small />
                  </div>
                  <div className="px-2 py-1 bg-card/80">
                    <p className="text-xs text-muted-foreground truncate">{i + 1}. {slide.content?.slice(0, 30) || slide.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // STANDARD VIEW
        <div className="flex flex-1 overflow-hidden">
          {presentation && (
            <div className="w-44 border-r border-border overflow-auto bg-card py-2 px-2 space-y-1.5">
              {slides.map((slide, i) => (
                <div key={slide.id || i} onClick={() => { setCurrentIndex(i); setIsBlack(false); }}
                  className={`cursor-pointer rounded-md overflow-hidden border-2 transition-all ${currentIndex === i ? "border-primary" : "border-transparent hover:border-primary/30"}`}>
                  <div className="aspect-video"><SlidePreview slide={slide} small /></div>
                  <p className="text-xs text-center text-muted-foreground py-0.5">{i + 1}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-black flex items-center justify-center relative">
              <AnimatePresence mode="wait">
                {isBlack ? (
                  <motion.div key="black" className="absolute inset-0 bg-black"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
                ) : currentSlide ? (
                  <motion.div key={currentIndex} className="w-full h-full max-w-5xl max-h-[80%] mx-auto p-4"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}>
                    <SlidePreview slide={currentSlide} />
                  </motion.div>
                ) : (
                  <div className="text-center">
                    <Radio className="w-12 h-12 text-white/10 mx-auto mb-3" />
                    <p className="text-white/20 text-sm">{presentation ? "No slides" : "Select a presentation"}</p>
                  </div>
                )}
              </AnimatePresence>
              {slides.length > 0 && (
                <div className="absolute bottom-4 right-4 text-white/40 text-xs font-mono">{currentIndex + 1} / {slides.length}</div>
              )}
            </div>

            <div className="bg-card border-t border-border px-6 py-4 flex items-center gap-4">
              <button onClick={() => go(-1)} disabled={currentIndex === 0}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <div className="flex-1 flex items-center gap-1.5 justify-center overflow-hidden">
                {slides.slice(Math.max(0, currentIndex - 4), currentIndex + 8).map((_, i) => {
                  const idx = Math.max(0, currentIndex - 4) + i;
                  return (
                    <button key={idx} onClick={() => { setCurrentIndex(idx); setIsBlack(false); }}
                      className={`h-1.5 rounded-full transition-all duration-200 ${idx === currentIndex ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground"}`} />
                  );
                })}
              </div>
              <button onClick={() => go(1)} disabled={currentIndex >= slides.length - 1}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-30 transition-colors">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-background px-6 py-2 flex gap-4 text-xs text-muted-foreground border-t border-border">
              <span>← → Navigate</span><span>Space: Next</span><span>B: Blank</span><span>P: Presenter View</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}