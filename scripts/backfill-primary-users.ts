/**
 * One-time backfill: mark the earliest user in each family as primary
 * if no primary user exists yet. Run after `npx prisma db push`.
 *
 * Usage: npx tsx scripts/backfill-primary-users.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const families = await prisma.family.findMany({
    include: {
      users: { orderBy: { createdAt: "asc" } },
    },
  });

  let updated = 0;
  for (const family of families) {
    const hasPrimary = family.users.some((u) => u.isPrimary);
    if (!hasPrimary && family.users.length > 0) {
      await prisma.user.update({
        where: { id: family.users[0].id },
        data: { isPrimary: true },
      });
      console.log(
        `Set primary: ${family.users[0].email} (${family.name})`
      );
      updated++;
    }
  }

  console.log(`Done. Updated ${updated} familie(s).`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
