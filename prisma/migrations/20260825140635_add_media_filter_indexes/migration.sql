-- CreateIndex
CREATE INDEX "media_published_idx" ON "media"("published");

-- CreateIndex
CREATE INDEX "media_category_idx" ON "media"("category");

-- CreateIndex
CREATE INDEX "media_collection_idx" ON "media"("collection");

-- CreateIndex
CREATE INDEX "media_featured_idx" ON "media"("featured");
