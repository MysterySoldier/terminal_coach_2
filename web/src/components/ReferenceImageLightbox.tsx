import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface ReferenceImageLightboxProps {
  src: string;
  alt: string;
  commandName: string;
  onClose: () => void;
}

export function ReferenceImageLightbox({
  src,
  alt,
  commandName,
  onClose,
}: ReferenceImageLightboxProps) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Gesture tracking refs
  const touchStartRef = useRef<{
    time: number;
    dist: number;
    scale: number;
    x: number;
    y: number;
    tx: number;
    ty: number;
    moved: boolean;
  }>({
    time: 0,
    dist: 0,
    scale: 1,
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    moved: false,
  });

  const mouseStartRef = useRef<{
    isDown: boolean;
    x: number;
    y: number;
    tx: number;
    ty: number;
    moved: boolean;
  }>({
    isDown: false,
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    moved: false,
  });

  const lastTapRef = useRef<number>(0);
  const closedByPopStateRef = useRef(false);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Prevent background scrolling while lightbox is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Handle phone back button via history state
  useEffect(() => {
    window.history.pushState({ referenceLightbox: true }, "");
    const handlePopState = () => {
      closedByPopStateRef.current = true;
      onCloseRef.current();
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (!closedByPopStateRef.current && window.history.state?.referenceLightbox) {
        window.history.back();
      }
    };
  }, []);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Double tap / double click toggle zoom
  const toggleZoom = useCallback((clientX?: number, clientY?: number) => {
    setScale((prevScale) => {
      if (prevScale > 1.2) {
        setTranslate({ x: 0, y: 0 });
        return 1;
      } else {
        if (clientX !== undefined && clientY !== undefined && imgRef.current) {
          const rect = imgRef.current.getBoundingClientRect();
          const offsetX = clientX - (rect.left + rect.width / 2);
          const offsetY = clientY - (rect.top + rect.height / 2);
          setTranslate({ x: -offsetX * 1.5, y: -offsetY * 1.5 });
        } else {
          setTranslate({ x: 0, y: 0 });
        }
        return 2.5;
      }
    });
  }, []);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const now = Date.now();
    if (e.touches.length === 2) {
      // Pinch start
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current = {
        time: now,
        dist,
        scale,
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        tx: translate.x,
        ty: translate.y,
        moved: true,
      };
      setIsDragging(true);
    } else if (e.touches.length === 1) {
      // Check double tap
      if (now - lastTapRef.current < 300) {
        e.preventDefault();
        toggleZoom(e.touches[0].clientX, e.touches[0].clientY);
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      touchStartRef.current = {
        time: now,
        dist: 0,
        scale,
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        tx: translate.x,
        ty: translate.y,
        moved: false,
      };
      if (scale > 1) {
        setIsDragging(true);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch move
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (touchStartRef.current.dist > 0) {
        const factor = dist / touchStartRef.current.dist;
        const newScale = Math.min(Math.max(touchStartRef.current.scale * factor, 1), 4);
        setScale(newScale);
        if (newScale === 1) {
          setTranslate({ x: 0, y: 0 });
        }
      }
      touchStartRef.current.moved = true;
    } else if (e.touches.length === 1 && scale > 1) {
      // Drag move
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        touchStartRef.current.moved = true;
      }
      const maxDragX = (window.innerWidth * (scale - 1)) / 2 + 80;
      const maxDragY = (window.innerHeight * (scale - 1)) / 2 + 80;
      const newX = Math.min(Math.max(touchStartRef.current.tx + dx, -maxDragX), maxDragX);
      const newY = Math.min(Math.max(touchStartRef.current.ty + dy, -maxDragY), maxDragY);
      setTranslate({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (scale <= 1.05) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }
  };

  // Mouse handlers (Desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1 && e.button === 0) {
      mouseStartRef.current = {
        isDown: true,
        x: e.clientX,
        y: e.clientY,
        tx: translate.x,
        ty: translate.y,
        moved: false,
      };
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mouseStartRef.current.isDown && scale > 1) {
      const dx = e.clientX - mouseStartRef.current.x;
      const dy = e.clientY - mouseStartRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        mouseStartRef.current.moved = true;
      }
      const maxDragX = (window.innerWidth * (scale - 1)) / 2 + 80;
      const maxDragY = (window.innerHeight * (scale - 1)) / 2 + 80;
      setTranslate({
        x: Math.min(Math.max(mouseStartRef.current.tx + dx, -maxDragX), maxDragX),
        y: Math.min(Math.max(mouseStartRef.current.ty + dy, -maxDragY), maxDragY),
      });
    }
  };

  const handleMouseUp = () => {
    mouseStartRef.current.isDown = false;
    setIsDragging(false);
  };

  // Backdrop click (closes if not dragged and click was outside the picture)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (imgRef.current && (imgRef.current === e.target || imgRef.current.contains(e.target as Node))) {
      return;
    }
    const target = e.target as HTMLElement;
    if (target.closest('[data-testid="lightbox-close"]')) {
      return;
    }
    if (!touchStartRef.current.moved && !mouseStartRef.current.moved) {
      onCloseRef.current();
    }
  };

  return (
    <div
      ref={containerRef}
      data-testid="image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`Enlarged illustration for ${commandName}`}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm select-none"
      style={{ touchAction: "none" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top bar with command name and Close button */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
        <span className="font-mono text-sm font-semibold tracking-wide text-white/90">
          {commandName}
        </span>
        <button
          type="button"
          data-testid="lightbox-close"
          onClick={onClose}
          aria-label="Close enlarged view"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 active:bg-white/30"
        >
          <X className="h-6 w-6" aria-hidden />
        </button>
      </div>

      {/* Main image container */}
      <div
        data-backdrop-area="true"
        className="relative flex items-center justify-center w-full h-full p-4 overflow-hidden"
      >
        <img
          ref={imgRef}
          data-testid="lightbox-image"
          src={src}
          alt={alt}
          draggable={false}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onDoubleClick={(e) => toggleZoom(e.clientX, e.clientY)}
          style={{
            transform: `translate3d(${translate.x}px, ${translate.y}px, 0) scale(${scale})`,
            transition: isDragging ? "none" : "transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)",
            maxHeight: "85vh",
            maxWidth: "96vw",
            touchAction: "none",
          }}
          className={`block object-contain rounded-lg shadow-2xl ${
            scale > 1
              ? isDragging
                ? "cursor-grabbing"
                : "cursor-grab"
              : "cursor-zoom-in"
          }`}
        />
      </div>

      {/* Subtle hint bar at bottom */}
      <div className="absolute bottom-4 left-0 right-0 pointer-events-none flex justify-center px-4">
        <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-[11px] text-white/80 backdrop-blur-md">
          {scale > 1
            ? "Drag to pan · Double-tap or pinch to reset"
            : "Double-tap or pinch to zoom"}
        </span>
      </div>
    </div>
  );
}
