"use client";

import * as React from "react";

/**
 * Custom SVG visual elements for KontrakPaham — "Teman Baca" identity.
 * Hand-drawn, warm, companion-feeling. NOT generic icon library.
 */

// Companion Logo Mark — a document with a warm "guide leaf/spark" overlapping.
// Suggests "living help resting on your document". Custom path, not lucide.
export function CompanionLogo({ className = "", size = 36 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Document — warm, rounded, slightly tilted feel */}
      <path
        d="M8 6.5C8 5.4 8.9 4.5 10 4.5H20L27 11.5V29.5C27 30.6 26.1 31.5 25 31.5H10C8.9 31.5 8 30.6 8 29.5V6.5Z"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M8 6.5C8 5.4 8.9 4.5 10 4.5H20L27 11.5V29.5C27 30.6 26.1 31.5 25 31.5H10C8.9 31.5 8 30.6 8 29.5V6.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Folded corner */}
      <path d="M20 4.5V9.5C20 10.6 20.9 11.5 22 11.5H27" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Text lines on document */}
      <path d="M12 16H22M12 19.5H22M12 23H18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      {/* Companion leaf/spark — overlapping, warm. The "friend" resting on doc. */}
      <path
        d="M24 21C24 21 26.5 19 29 20C30 22 28.5 24.5 26 25.5C23.5 26.5 21 25.5 21 25.5C21 25.5 21 23 24 21Z"
        fill="var(--terra)"
        stroke="var(--terra)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* Leaf vein */}
      <path d="M22.5 25C23.5 23.5 25 22 27 21" stroke="oklch(0.99 0.005 50)" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

// Hand-drawn circle — animates drawing around a clause. SVG path animation.
export function HandDrawnCircle({ className = "", color = "var(--terra)", delay = 0.4 }: { className?: string; color?: string; delay?: number }) {
  // Wobbly hand-drawn ellipse path
  const path = "M 10 50 Q 8 18, 48 14 Q 92 10, 94 50 Q 96 88, 50 92 Q 8 94, 10 50 Z";
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path
        d={path}
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 320,
          strokeDashoffset: 320,
          animation: `draw-stroke 1.2s ${delay}s cubic-bezier(0.65,0,0.35,1) both`,
        }}
      />
    </svg>
  );
}

// Hand-drawn arrow — points to a clause. Animated draw.
export function HandDrawnArrow({ className = "", color = "var(--terra)", delay = 1 }: { className?: string; color?: string; delay?: number }) {
  return (
    <svg
      className={className}
      viewBox="0 0 60 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M 4 15 Q 20 8, 45 14 M 45 14 L 38 9 M 45 14 L 40 20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={{
          strokeDasharray: 80,
          strokeDashoffset: 80,
          animation: `draw-stroke 0.8s ${delay}s cubic-bezier(0.65,0,0.35,1) both`,
        }}
      />
    </svg>
  );
}

// Relief illustration — "dari bingung → lega" (confusion to relief).
// Left: tangled anxious knot. Right: smooth calm circle with warm glow.
export function ReliefIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Left: tangled knot (confusion) */}
      <g opacity="0.5">
        <path
          d="M 20 40 Q 10 20, 30 25 Q 50 30, 35 45 Q 20 55, 30 35 Q 40 20, 25 50"
          stroke="oklch(0.5 0.02 40)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 15 35 Q 25 50, 40 30 Q 30 15, 20 45"
          stroke="oklch(0.5 0.02 40)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </g>
      {/* Arrow — transformation */}
      <path
        d="M 65 40 Q 80 35, 95 40 M 95 40 L 88 35 M 95 40 L 90 45"
        stroke="var(--terra)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={{
          strokeDasharray: 50,
          strokeDashoffset: 50,
          animation: "draw-stroke 1s 0.5s cubic-bezier(0.65,0,0.35,1) both",
        }}
      />
      {/* Right: calm circle with warm glow (relief) */}
      <circle cx="160" cy="40" r="22" fill="oklch(0.85 0.05 155 / 0.3)" className="animate-warm-breathe" />
      <circle
        cx="160"
        cy="40"
        r="16"
        stroke="var(--sage)"
        strokeWidth="2.5"
        fill="oklch(0.9 0.04 155 / 0.4)"
        strokeLinecap="round"
        style={{
          strokeDasharray: 100,
          strokeDashoffset: 100,
          animation: "draw-stroke 1s 1.2s cubic-bezier(0.65,0,0.35,1) both",
        }}
      />
      {/* Checkmark inside */}
      <path
        d="M 153 40 L 158 45 L 167 36"
        stroke="var(--sage)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={{
          strokeDasharray: 30,
          strokeDashoffset: 30,
          animation: "draw-stroke 0.5s 2s cubic-bezier(0.65,0,0.35,1) both",
        }}
      />
    </svg>
  );
}

// Warm sparkle — decorative "aha" moment marker
export function WarmSparkle({ className = "", size = 16 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M 8 0 L 9 6 L 16 8 L 9 10 L 8 16 L 7 10 L 0 8 L 7 6 Z"
        fill="var(--terra)"
        opacity="0.8"
      />
    </svg>
  );
}

// Decorative wavy divider — hand-drawn feel
export function WavyDivider({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M 0 4 Q 20 0, 40 4 T 80 4 T 120 4 T 160 4 T 200 4"
        stroke="var(--terra)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

// Companion figure — abstract "friend reading with you" (for empty states / hero accents)
export function CompanionFigure({ className = "", size = 64 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Head — warm circle */}
      <circle cx="32" cy="22" r="10" fill="oklch(0.85 0.04 45)" stroke="var(--terra)" strokeWidth="2" />
      {/* Eyes — friendly dots */}
      <circle cx="28" cy="22" r="1.5" fill="var(--ink)" />
      <circle cx="36" cy="22" r="1.5" fill="var(--ink)" />
      {/* Smile */}
      <path d="M 27 26 Q 32 30, 37 26" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Body — soft rounded shape, reading posture */}
      <path
        d="M 18 50 Q 18 38, 32 38 Q 46 38, 46 50 L 46 58 L 18 58 Z"
        fill="oklch(0.85 0.04 45)"
        stroke="var(--terra)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Book in hands */}
      <rect x="24" y="44" width="16" height="10" rx="1" fill="oklch(0.99 0.004 50)" stroke="var(--ink)" strokeWidth="1.2" />
      <path d="M 32 45 L 32 53" stroke="var(--ink)" strokeWidth="0.8" />
      <path d="M 26 47 L 30 47 M 34 47 L 38 47 M 26 49 L 30 49 M 34 49 L 38 49" stroke="var(--ink)" strokeWidth="0.5" opacity="0.5" />
    </svg>
  );
}

// Warm blob — organic decorative shape (not geometric)
export function WarmBlob({ className = "", color = "var(--terra)" }: { className?: string; color?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M 100 20 Q 160 30, 175 90 Q 185 150, 130 170 Q 70 180, 35 140 Q 10 100, 30 60 Q 55 20, 100 20 Z"
        fill={color}
        opacity="0.08"
      />
    </svg>
  );
}
