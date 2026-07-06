import type { Metadata } from "next";

import { EmbeddingMap } from "@/components/lab/embedding-map";
import { ExperimentSection } from "@/components/lab/experiment-section";
import { ObjectDetector } from "@/components/lab/object-detector";
import { RateLimiter } from "@/components/lab/rate-limiter";
import { RequestCycle } from "@/components/lab/request-cycle";
import { ARCHITECTURE, REQUEST_CYCLE_ANCHOR } from "@/lib/content/architecture";
import {
  EMBEDDING_MAP,
  EMBEDDING_MAP_ANCHOR,
  RATE_LIMITER,
  RATE_LIMITER_ANCHOR,
  VISION,
} from "@/lib/content/lab";
import { VISION_DEMO_ANCHOR } from "@/lib/search/chunks";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Lab — ${SITE.name}`,
  description:
    "Live, in-browser experiments: on-device object detection, the search index visualized, a rate limiter you can stress, and a real production request traced end to end.",
};

export default function LabPage(): React.JSX.Element {
  return (
    <main className="mx-auto w-full max-w-[1040px] flex-1 px-[min(7vw,64px)] py-[8vh]">
      <div className="mb-[14px] font-mono text-[12px] font-medium tracking-[0.06em] text-(--accent) uppercase">
        Lab
      </div>
      <h1 className="mb-4 text-[clamp(28px,4vw,42px)] leading-[1.15] font-semibold tracking-[-0.02em]">
        Things you can poke
      </h1>
      <p className="mb-14 max-w-[640px] text-[17px] leading-[1.7] text-(--text-secondary)">
        Live experiments, every one running entirely in your browser — no
        servers, nothing recorded. Same engineering as the rest of the site,
        just more fun.
      </p>

      <ExperimentSection
        anchor={VISION_DEMO_ANCHOR}
        eyebrow={VISION.eyebrow}
        lead={VISION.lead}
        accentLine={VISION.privacy}
      >
        <ObjectDetector />
      </ExperimentSection>

      <ExperimentSection
        anchor={EMBEDDING_MAP_ANCHOR}
        eyebrow={EMBEDDING_MAP.eyebrow}
        lead={EMBEDDING_MAP.lead}
      >
        <EmbeddingMap />
      </ExperimentSection>

      <ExperimentSection
        anchor={RATE_LIMITER_ANCHOR}
        eyebrow={RATE_LIMITER.eyebrow}
        lead={RATE_LIMITER.lead}
      >
        <RateLimiter />
      </ExperimentSection>

      <ExperimentSection
        anchor={REQUEST_CYCLE_ANCHOR}
        eyebrow={ARCHITECTURE.eyebrow}
        lead={ARCHITECTURE.intro}
      >
        <RequestCycle />
      </ExperimentSection>
    </main>
  );
}
