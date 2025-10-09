import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  await prisma.user.update({
    where: { email: "lecturer@example.com" },
    data: { role: "lecturer" }, // <- lowercase to match requireRole(["lecturer"])
  });
  console.log("Role set to lecturer");
}
main().finally(async () => prisma.$disconnect());
