// Simple local session keyed by ?code=XXXX
export type ReviewerSession = {
    code: string;       // the unique invite code you share in the URL
    label?: string;     // your private alias (e.g., "INT4") — owner only
  };
  
  const KEY = "thesis-review-session";
  const LABELS_KEY = "thesis-reviewer-labels"; // map code -> label
  
  // Read current session (from URL or localStorage)
  export function getSessionFromUrlOrStorage(): ReviewerSession | null {
    if (typeof window === "undefined") return null;
  
    const url = new URL(window.location.href);
    const code = (url.searchParams.get("code") || "").trim();
  
    if (code) {
      const s: ReviewerSession = { code };
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
  
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
  
    try {
      return JSON.parse(raw) as ReviewerSession;
    } catch {
      return null;
    }
  }
  
  export function setReviewerLabel(code: string, label: string) {
    const map = getReviewerLabels();
    map[code] = label;
    localStorage.setItem(LABELS_KEY, JSON.stringify(map));
  }
  
  export function getReviewerLabel(code: string): string | undefined {
    const map = getReviewerLabels();
    return map[code];
  }
  
  export function getReviewerLabels(): Record<string, string> {
    try {
      return JSON.parse(localStorage.getItem(LABELS_KEY) || "{}");
    } catch {
      return {};
    }
  }
  
  export function listAllReviewerCodes(): string[] {
    // For local-first, scan localStorage keys used by comments (see overlay)
    const codesKey = "thesis-comment-codes";
    try {
      return JSON.parse(localStorage.getItem(codesKey) || "[]");
    } catch {
      return [];
    }
  }
  
  export function addKnownReviewerCode(code: string) {
    if (!code) return;
    const codesKey = "thesis-comment-codes";
    const set = new Set(listAllReviewerCodes());
    set.add(code);
    localStorage.setItem(codesKey, JSON.stringify([...set]));
  }
  