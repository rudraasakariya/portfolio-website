interface ProjectPreviewProps {
  caption: string;
}

export function ProjectPreview({ caption }: ProjectPreviewProps): React.JSX.Element {
  return (
    <>
      <div className="chrome">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
      <div className="frame-stripes stripes">
        <span className="font-mono text-[12px] font-medium text-(--text-muted)">
          {caption}
        </span>
      </div>
    </>
  );
}
