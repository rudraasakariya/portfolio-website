import Image from "next/image";

export type PreviewIcon = "clipboard" | "shield";

interface ProjectPreviewProps {
  caption: string;
  image: string | null;
  /** Real captured CLI output, rendered as a static terminal block. */
  terminal?: ReadonlyArray<string> | null;
  /** Small centered glyph for projects with no visual artifact to show. */
  icon?: PreviewIcon | null;
  /** Set for the screenshot that's above the fold on first paint. */
  priority?: boolean;
}

const ICONS: Record<PreviewIcon, React.JSX.Element> = {
  clipboard: (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <rect x="6" y="4" width="12" height="17" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <path
        d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export function ProjectPreview({
  caption,
  image,
  terminal = null,
  icon = null,
  priority = false,
}: ProjectPreviewProps): React.JSX.Element {
  return (
    <>
      <div className="chrome">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
      {image !== null ? (
        <div className="frame-image-wrap">
          <Image
            src={image}
            alt={caption}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="frame-image"
            priority={priority}
          />
        </div>
      ) : terminal !== null ? (
        <div className="frame-stripes frame-terminal">
          <div className="terminal-block">
            {terminal.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      ) : icon !== null ? (
        <div className="frame-stripes stripes frame-icon">
          <span className="text-(--text-muted)">{ICONS[icon]}</span>
          <span className="font-mono text-[12px] font-medium text-(--text-muted)">
            {caption}
          </span>
        </div>
      ) : (
        <div className="frame-stripes stripes">
          <span className="font-mono text-[12px] font-medium text-(--text-muted)">
            {caption}
          </span>
        </div>
      )}
    </>
  );
}
