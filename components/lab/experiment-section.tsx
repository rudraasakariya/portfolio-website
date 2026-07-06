interface ExperimentSectionProps {
  anchor: string;
  eyebrow: string;
  lead: string;
  /** Optional mono accent line under the lead (e.g. the privacy note). */
  accentLine?: string;
  children: React.ReactNode;
}

/** Shared rhythm for every Lab experiment: eyebrow → lead → 760px frame. */
export function ExperimentSection({
  anchor,
  eyebrow,
  lead,
  accentLine,
  children,
}: ExperimentSectionProps): React.JSX.Element {
  return (
    <section id={anchor} className="mb-20">
      <div className="mb-3 font-mono text-[11px] font-medium tracking-[0.08em] text-(--text-muted) uppercase">
        {eyebrow}
      </div>
      <p
        className={`${accentLine !== undefined ? "mb-2" : "mb-7"} m-0 max-w-[640px] text-[15px] leading-[1.6] text-(--text-secondary)`}
      >
        {lead}
      </p>
      {accentLine !== undefined && (
        <p className="m-0 mb-7 max-w-[640px] font-mono text-[13px] font-medium text-(--accent)">
          {accentLine}
        </p>
      )}
      <div className="max-w-[760px]">{children}</div>
    </section>
  );
}
