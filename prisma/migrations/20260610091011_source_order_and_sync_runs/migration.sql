-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "sourceCreatedAt" TIMESTAMP(3),
ADD COLUMN     "sourceUpdatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "pagesScanned" INTEGER NOT NULL DEFAULT 0,
    "productUrlsFound" INTEGER NOT NULL DEFAULT 0,
    "importedProducts" INTEGER NOT NULL DEFAULT 0,
    "newProducts" INTEGER NOT NULL DEFAULT 0,
    "updatedProducts" INTEGER NOT NULL DEFAULT 0,
    "imagesDownloaded" INTEGER NOT NULL DEFAULT 0,
    "failedProducts" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SyncRun_source_idx" ON "SyncRun"("source");

-- CreateIndex
CREATE INDEX "SyncRun_startedAt_idx" ON "SyncRun"("startedAt");

-- CreateIndex
CREATE INDEX "Product_sourceCreatedAt_idx" ON "Product"("sourceCreatedAt");

-- CreateIndex
CREATE INDEX "Product_sourceUpdatedAt_idx" ON "Product"("sourceUpdatedAt");
