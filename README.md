# EventGate

EventGate models a structured event-approval workflow for organizations that need deadlines, role separation, and an auditable decision trail.

**Live demo:** [eventgate-wheat.vercel.app](https://eventgate-wheat.vercel.app)

## Workflow

1. A club president submits an event request.
2. The vice president and secretary provide separate internal approvals.
3. Approved requests move to student-union review.
4. A director performs the final review.
5. Deadlines, decisions, timestamps, comments, and expiration states are recorded.

## Core rules

- Event submissions must satisfy the configured lead-time window.
- Approval roles are distinct and decisions are treated as immutable.
- Missing approvals can expire a request rather than silently advancing it.
- Each stage has explicit pending, approved, rejected, or expired states.

## Technology

- Next.js and React
- TypeScript
- PostgreSQL/Prisma-backed application structure
- Better Auth
- Resend for email workflows

## Local development

```bash
npm install
npm run dev
```

Useful checks and administration commands:

```bash
npm run lint
npm run build
npm run seed:admin
```

The application requires the database, authentication, and email environment variables used by the deployment.
