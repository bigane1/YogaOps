-- Abonnements : champs Stripe Billing récurrents
ALTER TABLE "PackagePlan" ADD COLUMN "allowedCourseType" TEXT;
ALTER TABLE "PackagePlan" ADD COLUMN "billingIntervalMonths" INTEGER;
ALTER TABLE "PackagePlan" ADD COLUMN "stripePriceId" TEXT;
ALTER TABLE "PackagePlan" ADD COLUMN "fixedCourseId" TEXT REFERENCES "Course"("id");

-- Subscription : champs Stripe + cours fixe
ALTER TABLE "Booking" ADD COLUMN "subscriptionId" TEXT;

-- CreateTable Subscription
CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT NOT NULL DEFAULT 'subscription',
    "packageId" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripeCustomerId" TEXT,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "fixedCourseId" TEXT,
    CONSTRAINT "Subscription_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "PackagePlan" ("id") ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateTable SubscriptionWeek
CREATE TABLE IF NOT EXISTS "SubscriptionWeek" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT NOT NULL,
    "weekStart" DATETIME NOT NULL,
    "remainingSessions" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubscriptionWeek_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionWeek_subscriptionId_weekStart_key" ON "SubscriptionWeek"("subscriptionId", "weekStart");

-- Booking : lien subscription
CREATE INDEX IF NOT EXISTS "Booking_subscriptionId_idx" ON "Booking"("subscriptionId");

-- TimeSlot : lien zoom partagé
ALTER TABLE "TimeSlot" ADD COLUMN "zoomLink" TEXT;

-- Course : ateliers + bienfaits + image
ALTER TABLE "Course" ADD COLUMN "isWorkshop" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Course" ADD COLUMN "benefits" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Course" ADD COLUMN "coverImage" TEXT NOT NULL DEFAULT '';
