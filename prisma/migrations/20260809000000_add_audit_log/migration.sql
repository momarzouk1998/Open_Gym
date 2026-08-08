-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "meta" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_gym_id_created_at_idx" ON "audit_logs"("gym_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_gym_id_entity_type_idx" ON "audit_logs"("gym_id", "entity_type");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
