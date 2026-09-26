"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

const KEY = "tokenspace:watchlist:v2";
const EVENT = "tokenspace-watchlist-change";

function readList() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export default function WatchlistButton({ address }: { address: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(readList().includes(address));
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, [address]);

  function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const next = readList();
    const index = next.indexOf(address);
    if (index >= 0) next.splice(index, 1);
    else next.unshift(address);
    localStorage.setItem(KEY, JSON.stringify(next.slice(0, 100)));
    setSaved(!saved);
    window.dispatchEvent(new Event(EVENT));
  }

  return (
    <button
      type="button"
      className={saved ? "watch-btn saved" : "watch-btn"}
      onClick={toggle}
      aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
      title={saved ? "Remove from watchlist" : "Add to watchlist"}
    >
      <Star size={15} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
