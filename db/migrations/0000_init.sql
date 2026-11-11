CREATE TABLE "classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizer_id" text NOT NULL,
	"type" jsonb NOT NULL,
	"name" text NOT NULL,
	"level" text,
	"weekday" text,
	"time" text,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"title" text NOT NULL,
	"host" text,
	"host_name" text,
	"locate" text,
	"locate_name" text,
	"area" text,
	"start_at" text,
	"end_at" text,
	"rate" text,
	"types" text[] DEFAULT '{}' NOT NULL,
	"fee" text,
	"canceled" boolean DEFAULT false NOT NULL,
	"content" text,
	"note" text,
	"event_url" text,
	"calendar_event_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text,
	"thumbnail" text,
	"content" text,
	"links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"related" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"solo" boolean,
	"hide" boolean,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "workshops" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text,
	"date" date NOT NULL,
	"start_at" text,
	"end_at" text,
	"locate" text,
	"level" text,
	"price" text,
	"details" text,
	"url" text,
	"host" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_organizer_id_organizers_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."organizers"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "classes_organizer_idx" ON "classes" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "events_date_idx" ON "events" USING btree ("date");--> statement-breakpoint
CREATE INDEX "workshops_date_idx" ON "workshops" USING btree ("date");