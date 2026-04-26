ALTER TABLE "oauth_clients" DROP CONSTRAINT "oauth_clients_client_secret_unique";--> statement-breakpoint
ALTER TABLE "oauth_clients" ALTER COLUMN "client_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "oauth_clients" ALTER COLUMN "client_secret" SET DATA TYPE text;