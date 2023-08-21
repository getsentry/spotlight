/*
Copyright (C) 2021 Santo Pfingsten

  This software is provided 'as-is', without any express or implied
  warranty.  In no event will the authors be held liable for any damages
  arising from the use of this software.

  Permission is granted to anyone to use this software for any purpose,
  including commercial applications, and to alter it and redistribute it
  freely, subject to the following restrictions:

  1. The origin of this software must not be misrepresented; you must not
     claim that you wrote the original software. If you use this software
     in a product, an acknowledgment in the product documentation would be
     appreciated but is not required.
  2. Altered source versions must be plainly marked as such, and must not be
     misrepresented as being the original software.
  3. This notice may not be removed or altered from any source distribution.
*/

// https://github.com/Lusito/react-nano

import { useEffect, useRef, useState } from "react";

type EventSourceConstructor = {
  new (url: string, eventSourceInitDict?: EventSourceInit): EventSource;
};

export type EventSourceStatus = "init" | "open" | "closed" | "error";

export type EventSourceEvent = Event & { data: string };

export function useEventSource(
  url: string,
  withCredentials?: boolean,
  ESClass: EventSourceConstructor = EventSource
) {
  const source = useRef<EventSource | null>(null);
  const [status, setStatus] = useState<EventSourceStatus>("init");
  useEffect(() => {
    if (url) {
      const es = new ESClass(url, { withCredentials });
      source.current = es;

      es.addEventListener("open", () => setStatus("open"));
      es.addEventListener("error", () => setStatus("error"));

      return () => {
        source.current = null;
        es.close();
      };
    }

    setStatus("closed");

    return undefined;
  }, [url, withCredentials, ESClass]);

  return [source.current, status] as const;
}

export function useEventSourceListener(
  source: EventSource | null,
  types: string[],
  listener: (e: EventSourceEvent) => void,
  dependencies: any[] = []
) {
  useEffect(() => {
    if (source) {
      types.forEach((type) => source.addEventListener(type, listener as any));
      return () =>
        types.forEach((type) =>
          source.removeEventListener(type, listener as any)
        );
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, ...dependencies]);
}
