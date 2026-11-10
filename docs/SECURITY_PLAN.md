# MTG Super App — Security Plan

## Principles

Least privilege, server-side enforcement, privacy by default, evidence over assertion.

## Controls

| Area            | Control                                                                                                 | Phase     |
| --------------- | ------------------------------------------------------------------------------------------------------- | --------- |
| AuthN           | Supabase Auth (email verification, password recovery, Google when configured)                           | 1         |
| AuthZ           | RBAC via `role_permissions`; RLS is the enforcement layer; server-side permission checks                | 1         |
| Secrets         | Env vars only; `.env.example` has names, never values; secret scanning in CI                            | 1         |
| Headers         | CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy via `next.config`                       | 1         |
| Rate limiting   | Per-IP/user limiter on auth + API routes (in-memory in dev; Upstash/Edge KV in prod)                    | 1 (basic) |
| Audit           | Insert-only `audit_logs`; sensitive reads logged                                                        | 1+        |
| PII             | Private bucket, signed URLs, field-level access, consent table, retention rules                         | 2         |
| Employer access | Only consented + linked candidates; no bulk browse                                                      | 5         |
| AI              | No unrestricted DB write; human approval for eligibility/publishing/offers; PII minimisation in prompts | 7         |
| Messaging       | WhatsApp/email only with consent + owner approval; dry-run by default                                   | 4/7       |
| Legal mode      | `legal_operating_mode` default `information_only`; regulated flows gated                                | 1         |
| Backup/DR       | Supabase PITR, restore drill documented and executed before "production ready"                          | 8         |

## Compliance notes

Designed to respect Indonesian PDP Law (UU PDP) and Japan's APPI: purpose limitation, explicit consent, revocation, access/erasure workflow, retention schedule. **This is an engineering plan, not legal advice**; counsel review is required before processing real personal data. No claim is made about MTG's licensing status.

## Threat checklist (reviewed each phase)

IDOR on candidate/document IDs · privilege escalation via role tables · RLS bypass through service-role key use · file upload abuse (type/size/malware scan) · prompt injection through job/candidate text · webhook spoofing (HMAC) · enumeration via auth errors.
