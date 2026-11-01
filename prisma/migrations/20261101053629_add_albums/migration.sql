-- CreateTable
CREATE TABLE "albums" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "albums_name_key" ON "albums"("name");

-- Backfill: one album per album name already used by media, labeled with
-- the category most of its items have (ties go to the alphabetically first).
INSERT INTO "albums" ("id", "name", "category", "created_at", "updated_at")
SELECT
    'alb' || lower(hex(randomblob(10))),
    m."collection",
    (
        SELECT c."category" FROM "media" c
        WHERE c."collection" = m."collection" AND c."category" IS NOT NULL
        GROUP BY c."category"
        ORDER BY COUNT(*) DESC, c."category"
        LIMIT 1
    ),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "media" m
WHERE m."collection" IS NOT NULL
GROUP BY m."collection";
