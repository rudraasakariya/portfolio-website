import type { Metadata } from "next";

import { ObjectDetector } from "@/components/lab/object-detector";
import { RequestCycle } from "@/components/lab/request-cycle";
import { VISION_DEMO_ANCHOR } from "@/lib/search/chunks";
import { SITE } from "@/lib/site-config";

const PRIVACY_LINE =
  "Runs entirely in your browser — no video ever leaves your device.";

export const metadata: Metadata = {
  title: `Lab — ${SITE.name}`,
  description:
    "Live, in-browser experiments: on-device object detection and an interactive walk through a real production request.",
};

export default function LabPage(): React.JSX.Element {
  return (
    <main className="mx-auto w-full max-w-[1040px] flex-1 px-[7vw] py-[8vh]">
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

      <section id={VISION_DEMO_ANCHOR} className="mb-16">
        <div className="mb-3 font-mono text-[11px] font-medium tracking-[0.08em] text-(--text-muted) uppercase">
          Vision · on-device ML
        </div>
        <p className="mb-2 max-w-[640px] text-[15px] leading-[1.6] text-(--text-secondary)">
          A YOLOS transformer compiled to ONNX labels what your camera sees,
          frame by frame — the same stack that powers the ⌘K search here.
        </p>
        <p className="mb-7 max-w-[640px] font-mono text-[13px] font-medium text-(--accent)">
          {PRIVACY_LINE}
        </p>
        <div className="max-w-[720px]">
          <ObjectDetector />
        </div>
      </section>

      <RequestCycle />
    </main>
  );
}
