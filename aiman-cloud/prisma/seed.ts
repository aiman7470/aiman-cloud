import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.OWNER_EMAIL || "you@example.com";
  const password = process.env.OWNER_PASSWORD || "change-me-now";
  const name = process.env.OWNER_NAME || "Aiman";

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      passwordHash,
      storageQuota: BigInt(process.env.TOTAL_STORAGE_BYTES || "107374182400"),
      settings: { create: {} },
    },
  });

  const starterFolders = ["Photos", "Videos", "Documents", "Music"];
  for (const folderName of starterFolders) {
    const existing = await prisma.folder.findFirst({
      where: { ownerId: user.id, name: folderName, parentId: null },
    });
    if (!existing) {
      await prisma.folder.create({
        data: { name: folderName, ownerId: user.id },
      });
    }
  }

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "account.seeded",
      target: user.email,
    },
  });

  console.log(`Seeded owner account: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
