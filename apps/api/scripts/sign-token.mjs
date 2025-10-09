import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

const main = async () => {
  const user = await prisma.user.findUnique({ where: { email: "lecturer@example.com" }});
  if (!user) { throw new Error("User not found"); }
  const secret = process.env.JWT_SECRET;
  if (!secret) { throw new Error("JWT_SECRET missing"); }

  // Two common payload shapes:
  const tokenId = jwt.sign({ id: user.id, role: user.role }, secret, { expiresIn: "7d" });
  const tokenUserId = jwt.sign({ userId: user.id, role: user.role }, secret, { expiresIn: "7d" });

  console.log(JSON.stringify({ id: user.id, role: user.role, tokenId, tokenUserId }, null, 2));
};

main().finally(async () => { await prisma.$disconnect(); });
