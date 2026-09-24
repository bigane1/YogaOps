-- Course : paiement unitaire / cartes de credits
ALTER TABLE "Course" ADD COLUMN "acceptsUnitPayment" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Course" ADD COLUMN "acceptsCreditPayment" BOOLEAN NOT NULL DEFAULT true;

-- Member
CREATE TABLE "Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "firstName" TEXT NOT NULL DEFAULT '',
    "lastName" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "googleId" TEXT,
    "profileComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");
CREATE UNIQUE INDEX "Member_googleId_key" ON "Member"("googleId");

-- CreditPack
CREATE TABLE "CreditPack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "creditCount" INTEGER NOT NULL,
    "priceEur" INTEGER NOT NULL,
    "validityDays" INTEGER NOT NULL DEFAULT 365,
    "eligibility" TEXT NOT NULL DEFAULT 'both',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- MemberCreditCard
CREATE TABLE "MemberCreditCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "remainingCredits" INTEGER NOT NULL,
    "totalCredits" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "purchasedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "stripeSessionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MemberCreditCard_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MemberCreditCard_packId_fkey" FOREIGN KEY ("packId") REFERENCES "CreditPack" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "MemberCreditCard_stripeSessionId_key" ON "MemberCreditCard"("stripeSessionId");

-- Booking : lier membre + carte de credits
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT NOT NULL,
    "zoomLink" TEXT,
    "slotId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "memberId" TEXT,
    "memberCreditCardId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "TimeSlot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Booking_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Booking_memberCreditCardId_fkey" FOREIGN KEY ("memberCreditCardId") REFERENCES "MemberCreditCard" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("createdAt", "customerEmail", "customerName", "id", "paymentMethod", "slotId", "status", "subscriptionId", "zoomLink")
SELECT "createdAt", "customerEmail", "customerName", "id", "paymentMethod", "slotId", "status", "subscriptionId", "zoomLink" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
