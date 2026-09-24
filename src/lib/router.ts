import { useEffect, useState } from "react";

export type Route =
  | { name: "timeline" }
  | { name: "intervals" }
  | { name: "model"; id: string };

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, "");
  const m = path.match(/^\/model\/([a-z0-9-]+)$/);
  if (m) return { name: "model", id: m[1] };
  if (path === "/intervals") return { name: "intervals" };
  return { name: "timeline" };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export const href = {
  timeline: "#/",
  intervals: "#/intervals",
  model: (id: string) => `#/model/${id}`,
};
