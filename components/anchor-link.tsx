"use client";

import { useAnchorJump } from "@/lib/use-anchor-jump";

interface AnchorLinkProps {
  route: string;
  anchor: string;
  className?: string;
  children: React.ReactNode;
}

/** Link to an anchored section that keeps the id out of the URL bar. */
export function AnchorLink({
  route,
  anchor,
  className,
  children,
}: AnchorLinkProps): React.JSX.Element {
  const jump = useAnchorJump();

  return (
    <a
      href={route}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        jump(route, anchor);
      }}
    >
      {children}
    </a>
  );
}
