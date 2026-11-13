import type { FastifyRequest } from "fastify";
import { requirePermission } from "../../acess-controll/interface/require-permission.js";

const requirePayroll = requirePermission("ft")("gerar_relatorio_edital");

export async function canReadHolerites(
  request: FastifyRequest,
): Promise<boolean> {
  try {
    await requirePayroll(request);
    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      "statusCode" in error &&
      error.statusCode === 403
    )
      return false;
    throw error;
  }
}

export async function authorizeHoleriteFile(
  request: FastifyRequest<{ Params: { id: string } }>,
  files: { isHolerite(id: string): Promise<boolean> },
) {
  if (await files.isHolerite(request.params.id)) await requirePayroll(request);
}
