import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { projectId: string } }
) {
  const data = await prisma.chatDailySummary.findMany({
    where: { projectId: params.projectId },
    orderBy: { date: "desc" },
    take: 20,
  });

  return Response.json(data);
}