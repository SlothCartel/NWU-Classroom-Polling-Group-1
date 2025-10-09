import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const plain = "Password123!";
  const hashed = await bcrypt.hash(plain, 10);

  await prisma.user.upsert({
    where: { email: "lecturer@example.com" },
    update: {},
    create: {
      name: "Test Lecturer",
      email: "lecturer@example.com",
      password: hashed,      // <-- store the bcrypt hash in `password`
      role: "LECTURER",
      // studentNumber: null, // uncomment if your schema requires it or you want it null
    },
  });

  console.log("Lecturer ready: lecturer@example.com");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
