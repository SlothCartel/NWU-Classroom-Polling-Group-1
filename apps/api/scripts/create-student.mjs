import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const studentNumber = "37613480";
  const email = `student${studentNumber}@example.com`;
  const name = "Test Student";
  const plain = "Student123!";
  const password = await bcrypt.hash(plain, 10); // schema stores hash in `password`

  const user = await prisma.user.upsert({
    where: { email },
    update: { studentNumber, role: "student" },
    create: {
      name,
      email,
      password,
      role: "student",
      studentNumber,
    },
  });

  console.log("Student ready:", { id: user.id, email: user.email, studentNumber: user.studentNumber, role: user.role });
}

main().finally(async () => prisma.$disconnect());
