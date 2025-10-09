import "dotenv/config";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: "lecturer@example.com" }});
  if (!user) throw new Error("User not found");
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing");

  // EXACT SHAPE REQUIRED BY MIDDLEWARE:
  const token = jwt.sign({ userId: user.id }, secret, { expiresIn: "2h" });
  console.log(token);
}
main().finally(async () => prisma.$disconnect());
