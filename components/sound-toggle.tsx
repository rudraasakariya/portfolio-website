"use client";

import { useSyncExternalStore } from "react";

import { soundManager } from "@/lib/sound-manager";

/**
 * Speaker button that mutes/unmutes all synthesized UI sounds. Bound to the
 * sound manager singleton via useSyncExternalStore so every instance stays in
 * sync and hydration is safe.
 */
export function SoundToggle(): React.JSX.Element {
  const muted = useSyncExternalStore(
    soundManager.subscribe,
    soundManager.getMuted,
    soundManager.getServerMuted,
  );

  const handleClick = (): void => {
    if (muted) {
      soundManager.toggleMuted();
      soundManager.play("unmute");
    } else {
      // Play the "off" thud while still audible, then mute.
      soundManager.play("mute");
      soundManager.toggleMuted();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerEnter={() => soundManager.play("hover")}
      aria-label={muted ? "Unmute interface sounds" : "Mute interface sounds"}
      aria-pressed={!muted}
      className="sound-btn"
      data-muted={muted}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M4 9.5v5h3.2L12 18.6V5.4L7.2 9.5H4z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          className="sound-wave sound-wave-1"
          d="M15 9.2a4.2 4.2 0 0 1 0 5.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          className="sound-wave sound-wave-2"
          d="M17.5 6.8a7.6 7.6 0 0 1 0 10.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <line
          className="sound-slash"
          x1="4.5"
          y1="19.5"
          x2="19.5"
          y2="4.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
