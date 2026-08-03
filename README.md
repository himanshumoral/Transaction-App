# CoreBank Engine — Banking Transaction System

A full-stack banking application built around a **double-entry ledger**, with atomic transaction handling, idempotent transfers, and PIN-verified transactions.

**Live demo:** https://transaction-app-4g2s.onrender.com/login.html

> Note: hosted on Render's free tier — the first request after a period of inactivity may take 30–60 seconds while the server wakes up.

---

## Overview

Most beginner banking-app clones store a single `balance` field on the user and update it directly. This project instead derives balance from an **immutable ledger** — every transaction writes two entries (a debit and a credit), and the account balance is always computed as `SUM(credits) − SUM(debits)`. No balance field is ever edited directly, which means the transaction history is the source of truth, not a side effect of it.

## Key features

- **Double-entry ledger** — every transaction produces a linked debit and credit entry; balance is always derived, never stored and mutated
- **Atomic transactions** — MongoDB sessions ensure a transfer either fully completes (transaction + both ledger entries + balance update) or fully rolls back, with no partial state
- **Idempotency keys** — duplicate submissions (e.g. from network retries or double-clicks) are detected and safely short-circuited instead of double-processing
- **Username-based transfers** — users send money by username rather than exposing internal account IDs
- **PIN-protected transactions** — a 4-digit PIN (hashed, never stored in plaintext) is required for every transfer, independent of the account login password
- **Race condition handling** — balance is checked and reserved within the same transaction session, closing a window where two concurrent transfers could both read a stale balance and overdraw an account
- **Email notifications** — transaction confirmations sent via Gmail (OAuth2), fired asynchronously so a slow email provider can't delay the API response
- **System account seeding** — a protected `systemUser` flag (schema-immutable, settable only via direct DB access) allows initial funds to be issued into the ledger without exposing that capability through any API route

## Tech stack

**Backend:** Node.js, Express, MongoDB, Mongoose
**Frontend:** HTML, CSS, JavaScript (no framework)
**Auth:** JWT-based sessions, bcrypt for password/PIN hashing
**Email:** Nodemailer with Gmail OAuth2
**Deployment:** Render

## Architecture notes

- `Account` documents never store a balance — `getBalance()` aggregates the ledger on demand
- `Transaction` documents track lifecycle state (`PENDING` → `COMPLETED` / `FAILED`) so a crash mid-transfer leaves an inspectable, non-silent trail
- Transfers run inside a MongoDB session (`startTransaction` / `commitTransaction` / `abortTransaction`), so a failure at any step (e.g. the second ledger write) rolls back everything written before it
- Two transfer entry points exist: a peer-to-peer route (username-to-username, PIN-verified) and a system-only route (funds issuance), gated by an `authSystemUserMiddleware` that only passes for accounts with `systemUser: true`

## Running locally

```bash
git clone https://github.com/himanshumoral/corebank-engine.git
cd corebank-engine/Backend
npm install
```

Create a `.env` file with:

```
MONGODB_URI=
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
PORT=3000
```

```bash
npm start
```

The server serves both the API and the frontend, so visiting `http://localhost:3000` is enough — no separate frontend server needed.

## What I'd build next

- Transaction reversal flow (currently a schema-level status exists but no route triggers it)
- Rate limiting on the transaction endpoint
- Move email sending to a proper queue instead of a fire-and-forget promise