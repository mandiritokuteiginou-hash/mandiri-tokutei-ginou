"use client";

import { CandidateProfile } from "./types";

const CANDIDATES_KEY = "mtg_candidates";
const SESSION_KEY = "mtg_candidate_session";
const ADMIN_SESSION_KEY = "mtg_admin_session";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getCandidates(): CandidateProfile[] {
  return read<CandidateProfile[]>(CANDIDATES_KEY, []);
}

export function saveCandidate(profile: CandidateProfile) {
  const all = getCandidates();
  const idx = all.findIndex((c) => c.email === profile.email);
  if (idx >= 0) {
    all[idx] = profile;
  } else {
    all.push(profile);
  }
  write(CANDIDATES_KEY, all);
}

export function findCandidate(email: string): CandidateProfile | undefined {
  return getCandidates().find((c) => c.email === email);
}

export function setCandidateSession(email: string | null) {
  write(SESSION_KEY, email);
}

export function getCandidateSession(): string | null {
  return read<string | null>(SESSION_KEY, null);
}

export function setAdminSession(active: boolean) {
  write(ADMIN_SESSION_KEY, active);
}

export function getAdminSession(): boolean {
  return read<boolean>(ADMIN_SESSION_KEY, false);
}
