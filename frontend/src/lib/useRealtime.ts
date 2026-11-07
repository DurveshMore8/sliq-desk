import { useContext, useEffect, useRef } from "react";
import { RealtimeContext, type RealtimeEvent } from "../realtime/context";

export type { RealtimeEvent };

export function useRealtime(
  onEvent: (event: RealtimeEvent) => void,
  onResync: () => void,
) {
  const ctx = useContext(RealtimeContext);
  if (!ctx)
    throw new Error("useRealtime must be used inside <RealtimeProvider>");

  const eventRef = useRef(onEvent);
  const resyncRef = useRef(onResync);

  useEffect(() => {
    eventRef.current = onEvent;
    resyncRef.current = onResync;
  });

  useEffect(
    () =>
      ctx.subscribe({
        onEvent: (event) => eventRef.current(event),
        onResync: () => resyncRef.current(),
      }),
    [ctx],
  );
}
