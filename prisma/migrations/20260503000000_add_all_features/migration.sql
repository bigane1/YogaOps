-- PackagePlan : Stripe Billing + cours fixe
ALTER TABLE "PackagePlan" ADD COLUMN "billingIntervalMonths" INTEGER;
ALTER TABLE "PackagePlan" ADD COLUMN "stripePriceId" TEXT;
ALTER TABLE "PackagePlan" ADD COLUMN "fixedCourseId" TEXT REFERENCES "Course"("id");

-- Subscription : Stripe + cours fixe + customerName
ALTER TABLE "Subscription" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Subscription" ADD COLUMN "customerName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Subscription" ADD COLUMN "fixedCourseId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- Course : ateliers + bienfaits + image de couverture
ALTER TABLE "Course" ADD COLUMN "isWorkshop" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Course" ADD COLUMN "benefits" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Course" ADD COLUMN "coverImage" TEXT NOT NULL DEFAULT '';
