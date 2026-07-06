import type { Metadata } from "next";

import { ObjectDetector } from "@/components/vision/object-detector";
import { VISION_DEMO_ANCHOR } from "@/lib/search/chunks";
import { SITE } from "@/lib/site-config";

const PRIVACY_LINE =
  "Runs entirely in your browser — no video ever leaves your device.";

export const metadata: Metadata = {
  title: `Vision — ${SITE.name}`,
  description: `Live in-browser object detection. ${PRIVACY_LINE}`,
};

export default function VisionPage(): React.JSX.Element {
  return (
    <main className="mx-auto w-full max-w-[1040px] flex-1 px-[7vw] py-[8vh]">
      <div className="mb-[14px] font-mono text-[12px] font-medium tracking-[0.06em] text-(--accent) uppercase">
        Playground
      </div>
      <h1 className="mb-4 text-[clamp(28px,4vw,42px)] leading-[1.15] font-semibold tracking-[-0.02em]">
        Vision
      </h1>
      <p className="mb-3 max-w-[640px] text-[17px] leading-[1.7] text-(--text-secondary)">
        A live object-detection demo: a YOLOS transformer compiled to ONNX runs
        on your device and labels what your camera sees, frame by frame. The
        same stack that powers the ⌘K search on this site.
      </p>
      <p className="mb-10 max-w-[640px] font-mono text-[13px] font-medium text-(--accent)">
        {PRIVACY_LINE}
      </p>

      <section id={VISION_DEMO_ANCHOR} className="max-w-[720px]">
        <ObjectDetector />
      </section>
    </main>
  );
}
