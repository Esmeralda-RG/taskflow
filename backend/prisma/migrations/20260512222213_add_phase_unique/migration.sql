/*
  Warnings:

  - A unique constraint covering the columns `[projectId,name]` on the table `phases` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "phases_projectId_name_key" ON "phases"("projectId", "name");
