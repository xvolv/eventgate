# EventGate

**EventGate** is a web-based event proposal and approval system designed to manage event requests through a structured, rule-driven workflow. It ensures events are requested on time, reviewed properly, and approved through defined authority levels.

The goal is simple: remove confusion, enforce policy, and make event approvals transparent and traceable.

---

## Problem Statement

In many organizations, event requests are handled manually through emails or informal messaging. This often results in:

- Late or last-minute requests  
- Unclear approval authority  
- Lost or ignored proposals  
- No visibility into approval status  

EventGate solves this by providing a centralized, enforceable, and auditable approval system.

---

## Key Features

- Event proposal submission with mandatory details  
- Deadline enforcement (minimum one-week advance submission)  
- Role-based access control (requester, reviewer, approver, admin)  
- Multi-stage approval workflow  
- Approval and rejection with remarks  
- Real-time status tracking  
- Audit trail with timestamps and decision history  
- Centralized dashboard for all event requests  

---

## Workflow Overview

1. A user submits an event proposal before the allowed deadline.
2. The system validates submission rules and timing.
3. The proposal is routed through predefined approval levels.
4. Approvers review, approve, or reject with comments.
5. Final status is recorded and visible to relevant users.

No side channels. No ambiguity.

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Frontend:** React
- **Backend:** Next.js API Routes / Server Actions
- **Database:** To be defined (e.g., PostgreSQL, MongoDB)
- **Authentication:** Role-based access control
- **UI Style:** Clean, minimal, system-oriented

---

## Project Structure (High Level)

```text
app/
├── auth/
├── dashboard/
├── events/
├── approvals/
├── admin/
components/
lib/
types/
utils/
