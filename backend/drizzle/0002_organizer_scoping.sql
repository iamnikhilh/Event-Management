-- Rename events.created_by_id -> organizer_id
ALTER TABLE "events" RENAME COLUMN "created_by_id" TO "organizer_id";

-- sessions.organizer_id
ALTER TABLE "sessions" ADD COLUMN "organizer_id" uuid;
UPDATE "sessions" AS s
SET "organizer_id" = e."organizer_id"
FROM "events" AS e
WHERE s."event_id" = e."id";
ALTER TABLE "sessions" ALTER COLUMN "organizer_id" SET NOT NULL;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_organizer_id_users_id_fk"
  FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
CREATE INDEX IF NOT EXISTS "sessions_organizer_id_idx" ON "sessions" USING btree ("organizer_id");

-- sponsors.organizer_id
ALTER TABLE "sponsors" ADD COLUMN "organizer_id" uuid;
UPDATE "sponsors" AS sp
SET "organizer_id" = e."organizer_id"
FROM "events" AS e
WHERE sp."event_id" = e."id";
ALTER TABLE "sponsors" ALTER COLUMN "organizer_id" SET NOT NULL;
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_organizer_id_users_id_fk"
  FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
CREATE INDEX IF NOT EXISTS "sponsors_organizer_id_idx" ON "sponsors" USING btree ("organizer_id");

-- ticket_types.organizer_id
ALTER TABLE "ticket_types" ADD COLUMN "organizer_id" uuid;
UPDATE "ticket_types" AS tt
SET "organizer_id" = e."organizer_id"
FROM "events" AS e
WHERE tt."event_id" = e."id";
ALTER TABLE "ticket_types" ALTER COLUMN "organizer_id" SET NOT NULL;
ALTER TABLE "ticket_types" ADD CONSTRAINT "ticket_types_organizer_id_users_id_fk"
  FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
CREATE INDEX IF NOT EXISTS "ticket_types_organizer_id_idx" ON "ticket_types" USING btree ("organizer_id");

-- attendees.organizer_id
ALTER TABLE "attendees" ADD COLUMN "organizer_id" uuid;
UPDATE "attendees" AS a
SET "organizer_id" = e."organizer_id"
FROM "events" AS e
WHERE a."event_id" = e."id";
ALTER TABLE "attendees" ALTER COLUMN "organizer_id" SET NOT NULL;
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_organizer_id_users_id_fk"
  FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
CREATE INDEX IF NOT EXISTS "attendees_organizer_id_idx" ON "attendees" USING btree ("organizer_id");

-- speakers.organizer_id (backfill existing rows to first organizer user)
ALTER TABLE "speakers" ADD COLUMN "organizer_id" uuid;
UPDATE "speakers"
SET "organizer_id" = (
  SELECT "id" FROM "users" WHERE "role" = 'organizer' ORDER BY "created_at" LIMIT 1
);
ALTER TABLE "speakers" ALTER COLUMN "organizer_id" SET NOT NULL;
ALTER TABLE "speakers" ADD CONSTRAINT "speakers_organizer_id_users_id_fk"
  FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
CREATE INDEX IF NOT EXISTS "speakers_organizer_id_idx" ON "speakers" USING btree ("organizer_id");

-- Row-Level Security (defense in depth; requires app.current_organizer_id session var)
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sponsors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ticket_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "speakers" ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION app_current_organizer_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_organizer_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_bypass_rls() RETURNS boolean AS $$
  SELECT current_setting('app.bypass_rls', true) = 'on';
$$ LANGUAGE sql STABLE;

CREATE POLICY "events_organizer_isolation" ON "events"
  AS RESTRICTIVE FOR ALL
  USING (
    app_bypass_rls()
    OR "organizer_id" = app_current_organizer_id()
  )
  WITH CHECK (
    app_bypass_rls()
    OR "organizer_id" = app_current_organizer_id()
  );

CREATE POLICY "sessions_organizer_isolation" ON "sessions"
  AS RESTRICTIVE FOR ALL
  USING (
    app_bypass_rls()
    OR "organizer_id" = app_current_organizer_id()
  )
  WITH CHECK (
    app_bypass_rls()
    OR "organizer_id" = app_current_organizer_id()
  );

CREATE POLICY "sponsors_organizer_isolation" ON "sponsors"
  AS RESTRICTIVE FOR ALL
  USING (
    app_bypass_rls()
    OR "organizer_id" = app_current_organizer_id()
  )
  WITH CHECK (
    app_bypass_rls()
    OR "organizer_id" = app_current_organizer_id()
  );

CREATE POLICY "ticket_types_organizer_isolation" ON "ticket_types"
  AS RESTRICTIVE FOR ALL
  USING (
    app_bypass_rls()
    OR "organizer_id" = app_current_organizer_id()
  )
  WITH CHECK (
    app_bypass_rls()
    OR "organizer_id" = app_current_organizer_id()
  );

CREATE POLICY "attendees_organizer_isolation" ON "attendees"
  AS RESTRICTIVE FOR ALL
  USING (
    app_bypass_rls()
    OR "organizer_id" = app_current_organizer_id()
  )
  WITH CHECK (
    app_bypass_rls()
    OR "organizer_id" = app_current_organizer_id()
  );

CREATE POLICY "speakers_organizer_isolation" ON "speakers"
  AS RESTRICTIVE FOR ALL
  USING (
    app_bypass_rls()
    OR "organizer_id" = app_current_organizer_id()
  )
  WITH CHECK (
    app_bypass_rls()
    OR "organizer_id" = app_current_organizer_id()
  );
