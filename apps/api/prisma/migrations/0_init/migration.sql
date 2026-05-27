-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(64) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "telegram_id" INTEGER,
    "avatar" VARCHAR(512),
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" VARCHAR(1024) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "symbols" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watchlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "screener_presets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "filters" JSONB NOT NULL,
    "sort_by" VARCHAR(64) NOT NULL DEFAULT 'volume24h',
    "sort_direction" VARCHAR(8) NOT NULL DEFAULT 'desc',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "screener_presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chart_layouts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "layout" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chart_layouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_rules" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" VARCHAR(64) NOT NULL,
    "symbol" VARCHAR(32),
    "exchange" VARCHAR(32),
    "condition" JSONB NOT NULL,
    "deliveries" TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" VARCHAR(64) NOT NULL,
    "symbol" VARCHAR(32) NOT NULL,
    "exchange" VARCHAR(32),
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "severity" VARCHAR(16) NOT NULL DEFAULT 'medium',
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stored_candles" (
    "id" TEXT NOT NULL,
    "symbol" VARCHAR(32) NOT NULL,
    "exchange" VARCHAR(32) NOT NULL,
    "timeframe" VARCHAR(8) NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "open" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "close" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "trades" INTEGER NOT NULL,
    "buy_volume" DOUBLE PRECISION NOT NULL,
    "sell_volume" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "stored_candles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detected_patterns" (
    "id" TEXT NOT NULL,
    "symbol" VARCHAR(32) NOT NULL,
    "exchange" VARCHAR(32) NOT NULL,
    "type" VARCHAR(64) NOT NULL,
    "timeframe" VARCHAR(8) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "points" JSONB NOT NULL,
    "direction" VARCHAR(16) NOT NULL,
    "target_price" DOUBLE PRECISION,
    "stop_loss" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detected_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "watchlists_user_id_idx" ON "watchlists"("user_id");

-- CreateIndex
CREATE INDEX "screener_presets_user_id_idx" ON "screener_presets"("user_id");

-- CreateIndex
CREATE INDEX "chart_layouts_user_id_idx" ON "chart_layouts"("user_id");

-- CreateIndex
CREATE INDEX "alert_rules_user_id_idx" ON "alert_rules"("user_id");

-- CreateIndex
CREATE INDEX "alert_rules_type_idx" ON "alert_rules"("type");

-- CreateIndex
CREATE INDEX "alert_rules_symbol_idx" ON "alert_rules"("symbol");

-- CreateIndex
CREATE INDEX "alerts_user_id_idx" ON "alerts"("user_id");

-- CreateIndex
CREATE INDEX "alerts_type_idx" ON "alerts"("type");

-- CreateIndex
CREATE INDEX "alerts_symbol_idx" ON "alerts"("symbol");

-- CreateIndex
CREATE INDEX "alerts_created_at_idx" ON "alerts"("created_at");

-- CreateIndex
CREATE INDEX "alerts_user_id_read_idx" ON "alerts"("user_id", "read");

-- CreateIndex
CREATE INDEX "stored_candles_symbol_exchange_timeframe_idx" ON "stored_candles"("symbol", "exchange", "timeframe");

-- CreateIndex
CREATE INDEX "stored_candles_timestamp_idx" ON "stored_candles"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "stored_candles_symbol_exchange_timeframe_timestamp_key" ON "stored_candles"("symbol", "exchange", "timeframe", "timestamp");

-- CreateIndex
CREATE INDEX "detected_patterns_symbol_exchange_idx" ON "detected_patterns"("symbol", "exchange");

-- CreateIndex
CREATE INDEX "detected_patterns_type_idx" ON "detected_patterns"("type");

-- CreateIndex
CREATE INDEX "detected_patterns_timeframe_idx" ON "detected_patterns"("timeframe");

-- CreateIndex
CREATE INDEX "detected_patterns_created_at_idx" ON "detected_patterns"("created_at");

-- CreateIndex
CREATE INDEX "detected_patterns_symbol_exchange_timeframe_type_idx" ON "detected_patterns"("symbol", "exchange", "timeframe", "type");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screener_presets" ADD CONSTRAINT "screener_presets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chart_layouts" ADD CONSTRAINT "chart_layouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
