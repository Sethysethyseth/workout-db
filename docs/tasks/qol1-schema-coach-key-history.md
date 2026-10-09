# TASK qol1: Schema + migration - encrypted coach key, coach conversation history

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
The wave's ONE migration (`docs/specs/quality-of-life-wave.md` section 1,
rulings 5 and 6). Two later units consume it: qol10 (coach history in
Library) and qol11 (the BYO coach key stored encrypted on the server). This
unit is schema + migration file ONLY - no runtime code reads these tables
yet. The schema IS the spec here, so it is fully specified below.

FILES TO TOUCH:
- server/prisma/schema.prisma            (three new models + two User
                                          relation fields)
- server/prisma/migrations/20261008120000_coach_key_and_history/migration.sql
                                         (new)
Do NOT modify anything outside these files.

CHANGE:
1. Before editing, copy the current `server/prisma/schema.prisma` to a temp
   path OUTSIDE the repo (e.g. `%TEMP%\schema.before.prisma`) - you need it
   for the offline diff and you may not use git.
2. Add to `model User` (keep the existing field order, append at the end):
   `coachKey UserCoachKey?` and `coachConversations CoachConversation[]`.
3. Add these models exactly (comments included):

```prisma
/// One stored bring-your-own coach key per user, AES-256-GCM encrypted by
/// server/src/coach/keyVault.js (qol11). Its own table on purpose: the User
/// row is returned by /auth/me minus only passwordHash.
model UserCoachKey {
  userId     String   @id
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  /// "v1:<iv b64>:<tag b64>:<ciphertext b64>" - never the plaintext key.
  ciphertext String
  /// Last 4 characters of the key, for "Key ending in ...". Display only.
  last4      String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model CoachConversation {
  id        Int            @id @default(autoincrement())
  userId    String
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
  /// The ask's validated focus at creation (coachRequest.js shape), or null.
  focus     Json?
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
  messages  CoachMessage[]

  @@index([userId, updatedAt])
}

model CoachMessage {
  id             Int               @id @default(autoincrement())
  conversationId Int
  conversation   CoachConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  /// "user" | "coach"
  role           String
  content        String
  createdAt      DateTime          @default(now())

  @@index([conversationId, createdAt])
}
```

4. Generate the migration OFFLINE (no database is reachable from this
   tree): from `server/`, run
   `npx prisma migrate diff --from-schema-datamodel <temp copy> --to-schema-datamodel prisma/schema.prisma --script`
   and save the output as the `migration.sql` above. Then run
   `npx prisma validate` and `npx prisma format --check` (or `format` then
   confirm no diff beyond your additions). Do NOT run `prisma migrate dev`,
   `migrate deploy`, `db push`, or anything that connects to a database.
5. Run `npm run prisma:generate` so the client types compile.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/` (no test changes expected).
- `npx prisma validate` passes.
- `migration.sql` contains exactly three `CREATE TABLE` statements
  (`UserCoachKey`, `CoachConversation`, `CoachMessage`), two `CREATE INDEX`
  statements matching the `@@index` lines, foreign keys with
  `ON DELETE CASCADE`, and ZERO `DROP` statements. Every `ALTER TABLE`
  in the file targets one of the three NEW tables - none targets
  `User` or any pre-existing table.
- No column of any pre-existing model changed (diff of schema.prisma shows
  only the two appended User relation lines plus the three new models).
- DELIVERY.md pastes the full `migration.sql`.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Before stopping, run every lane this block allows and write the delivery
  report to DELIVERY.md at the repo root (files touched; verbatim test
  output; each acceptance criterion with the evidence that proved it; any
  deviations from this block, with reasons). Do not commit it.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
