import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const pollId = Number(process.argv[2] || 0);
if (!pollId) { throw new Error("Pass pollId as argv[2]"); }

async function main() {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: { questions: { orderBy: { id: "asc" }, include: { options: true } } },
  });
  if (!poll) throw new Error("Poll not found");
  console.log(JSON.stringify(poll.questions.map(q => ({
    id: q.id,
    text: q.question_text ?? q.text,
    options: q.options.map(o => ({ id: o.id, text: o.option_text ?? o.text, index: o.optionIndex ?? o.index }))
  })), null, 2));
}
main().finally(async () => prisma.$disconnect());
