import "dotenv/config";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ where: { email: "student37613480@example.com" }});
  if (!user) throw new Error("Student not found");
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "2h" });
  console.log(token);
}
main().finally(async () => prisma.$disconnect());
