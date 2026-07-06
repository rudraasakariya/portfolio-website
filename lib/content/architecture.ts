/** Scroll target shared by the home section and the search index. */
export const REQUEST_CYCLE_ANCHOR = "request-cycle";

export type ArchNodeId = "client" | "middleware" | "service" | "database";

export interface ArchNode {
  id: ArchNodeId;
  label: string;
  sublabel: string;
  /** One-liner revealed when the node is clicked. */
  detail: string;
  /** Narration shown while the pulse is at this node. */
  hopCaption: string;
}

export const ARCH_NODES: ReadonlyArray<ArchNode> = [
  {
    id: "client",
    label: "Client UI",
    sublabel: "Next.js dashboard",
    detail:
      "A tutor opens their dashboard — the browser sends GET /api/sessions with their signed JWT attached.",
    hopCaption: "GET /api/sessions leaves the dashboard with the tutor's JWT.",
  },
  {
    id: "middleware",
    label: "Auth + isolation",
    sublabel: "middleware guard",
    detail:
      "The guard verifies the JWT's signature and expiry, then attaches the tutor's scope — a request can only ever see that tutor's own students.",
    hopCaption: "JWT verified — tutor scope attached before any logic runs.",
  },
  {
    id: "service",
    label: "Service layer",
    sublabel: "Next.js server logic",
    detail:
      "Pure business logic: scheduling rules, session status, KPI rollups — isolated modules the route handlers call, with no request or response objects past the boundary.",
    hopCaption: "Service resolves the sessions this tutor is allowed to see.",
  },
  {
    id: "database",
    label: "PostgreSQL",
    sublabel: "scoped query",
    detail:
      "Every query carries the tutor scope attached by the middleware — cross-tutor reads are impossible by construction, not by convention.",
    hopCaption: "SELECT … WHERE tutor_id = $1 — scoped at the database itself.",
  },
] as const;

export const ARCHITECTURE = {
  eyebrow: "Architecture · interactive",
  heading: "A real request, end to end",
  intro:
    "The exact path a request takes through the Rutgers tutoring platform I built and run. Click a node for details, or send one and watch.",
  sendLabel: "Send request →",
  sendingLabel: "In flight…",
  idleCaption: "Press “Send request →” to trace the path.",
  returnCaption: "Rows stream back through the service — response headed home.",
  responseCaption:
    "200 OK — the tutor's sessions render. Four hops, one tenant boundary, zero cross-tutor reads.",
} as const;
