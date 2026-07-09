import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

/**
 * MascotPortrait is the core pure CSS art mascot.
 * We've moved it here to be reusable.
 */
export function MascotPortrait({ 
  className,
  scale = 1
}: { 
  className?: string;
  scale?: number;
}) {
  return (
    <div 
      className={cn("mascot-portrait", className)}
      style={scale !== 1 ? { transform: `scale(${scale})` } : undefined}
    >
      <span className="mascot-portrait__horn mascot-portrait__horn--left" />
      <span className="mascot-portrait__horn mascot-portrait__horn--right" />
      <div className="mascot-portrait__head">
        <span className="mascot-portrait__hair mascot-portrait__hair--one" />
        <span className="mascot-portrait__hair mascot-portrait__hair--two" />
        <span className="mascot-portrait__ear mascot-portrait__ear--left" />
        <span className="mascot-portrait__ear mascot-portrait__ear--right" />
        <span className="mascot-portrait__brow mascot-portrait__brow--left" />
        <span className="mascot-portrait__brow mascot-portrait__brow--right" />
        <span className="mascot-portrait__eye mascot-portrait__eye--left" />
        <span className="mascot-portrait__eye mascot-portrait__eye--right" />
        <span className="mascot-portrait__snout">
          <span />
          <span />
        </span>
        <span className="mascot-portrait__smile" />
      </div>
      <div className="mascot-portrait__body">
        <span className="mascot-portrait__collar" />
        <span className="mascot-portrait__folder">
          <span />
          <span />
          <span />
        </span>
        <span className="mascot-portrait__hand mascot-portrait__hand--left" />
        <span className="mascot-portrait__hand mascot-portrait__hand--right" />
      </div>
      <div className="mascot-portrait__base">
        <span />
      </div>
    </div>
  );
}

/**
 * MascotBubble: Inline mascot (just head/partial body visible) with a speech bubble.
 */
export function MascotBubble({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("mascot-bubble flex items-center gap-3", className)}>
      <div className="mascot-bubble__avatar relative w-16 h-16 overflow-hidden rounded-full border border-border bg-[#F7F4ED] shrink-0">
        <MascotPortrait className="absolute -bottom-6 left-1/2 -translate-x-1/2" scale={0.45} />
      </div>
      <div className="mascot-bubble__text bg-[#F7F4ED] text-[#1F1B16] text-sm px-4 py-2.5 rounded-2xl rounded-tl-sm border border-border shadow-sm">
        {text}
      </div>
    </div>
  );
}

/**
 * MascotToast: Floating dismissable helper at bottom-right of the screen.
 */
export function MascotToast({ id, text, delayMs = 1500 }: { id: string; text: string; delayMs?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // default true to prevent hydration mismatch flashes

  useEffect(() => {
    // Check localStorage
    const dismissed = localStorage.getItem(`mascot_toast_${id}`);
    if (!dismissed) {
      // Defer state update to avoid synchronous state update in effect
      setTimeout(() => {
        setIsDismissed(false);
      }, 0);
      const timer = setTimeout(() => setIsVisible(true), delayMs);
      return () => clearTimeout(timer);
    }
  }, [id, delayMs]);

  if (isDismissed) return null;

  return (
    <div 
      className={cn(
        "mascot-toast fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 flex items-end gap-3 transition-all duration-500",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
      )}
    >
      <div className="mascot-toast__bubble bg-[#F7F4ED] text-[#1F1B16] text-sm px-4 py-3 rounded-2xl rounded-br-sm border border-border shadow-xl max-w-[240px] relative">
        <button 
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => {
              setIsDismissed(true);
              localStorage.setItem(`mascot_toast_${id}`, "true");
            }, 500); // Wait for exit animation
          }}
          className="absolute -top-2 -right-2 bg-background border border-border rounded-full p-0.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Tutup pesan"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        {text}
      </div>
      <div className="mascot-toast__avatar relative w-20 h-20 shrink-0 filter drop-shadow-lg">
        <MascotPortrait className="absolute bottom-0 right-0 origin-bottom-right" scale={0.5} />
      </div>
    </div>
  );
}

/**
 * MascotEmptyState: Large centered mascot for empty/error states.
 */
export function MascotEmptyState({ 
  title, 
  description, 
  calm = false,
  action
}: { 
  title: string; 
  description: string; 
  calm?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="mascot-empty flex flex-col items-center text-center max-w-sm mx-auto py-12">
      <div className="mascot-empty__stage relative h-40 w-40 mb-6 flex justify-center items-end">
        {/* Subtle background glow/platform */}
        <div className="absolute bottom-4 w-32 h-8 bg-black/5 rounded-[100%] blur-xl" />
        <MascotPortrait 
          className={cn("origin-bottom", calm ? "mascot-portrait--calm" : "")} 
          scale={0.7} 
        />
      </div>
      <h3 className="text-xl font-serif font-bold text-[#1F1B16] mb-2">{title}</h3>
      <p className="text-[#1F1B16]/70 text-sm leading-relaxed mb-6">{description}</p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
