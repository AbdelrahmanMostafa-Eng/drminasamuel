-- Uploaded files kept in the database when no S3/R2 storage is configured.
-- Written with IF NOT EXISTS because the app also creates these tables on first use
-- (src/lib/storage.ts), in case a deploy could not run migrations.
CREATE TABLE IF NOT EXISTS "StoredFile" (
    "key" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "complete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("key")
);

CREATE TABLE IF NOT EXISTS "StoredFileChunk" (
    "key" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,

    CONSTRAINT "StoredFileChunk_pkey" PRIMARY KEY ("key","index")
);

DO $$ BEGIN
  ALTER TABLE "StoredFileChunk" ADD CONSTRAINT "StoredFileChunk_key_fkey" FOREIGN KEY ("key") REFERENCES "StoredFile"("key") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
