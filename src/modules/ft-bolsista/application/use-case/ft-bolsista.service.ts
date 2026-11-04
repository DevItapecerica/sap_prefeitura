import { mapPeaadRuleError } from "../utils/map-peaad-rule-error.js";
import { ftError } from "../utils/ft-error.js";
import {
  FtBolsistaDto,
  FtBolsistaCancelamentoDto,
  FtBolsistaFaltaDto,
  FtBolsistaFaltaQueryDto,
  FtBolsistaOcorrenciaDto,
  FtBolsistaOcorrenciaQueryDto,
  FtBolsistaProrrogacaoDto,
  FtBolsistaQueryDto,
  FtBolsistaVinculoCandidatesQueryDto,
} from "../dto/ft-bolsista.dto.js";
import { FtBolsistaRepository } from "../../domain/repositories/ft-bolsista.repository.js";
import { FtBolsistaPolicyService } from "../../domain/services/ft-bolsista-policy.service.js";
import { FtFaltaPolicyService } from "../../domain/services/ft-falta-policy.service.js";
import { FtVinculoPolicyService } from "../../../ft-edital/domain/services/ft-vinculo-policy.service.js";
import {
  saoPauloDateParts,
  todayInSaoPaulo,
} from "../../../../core/utils/sao-paulo-date.js";

export class FtBolsistaService {
  constructor(
    private readonly repository: FtBolsistaRepository,
    private readonly policy = new FtBolsistaPolicyService(),
    private readonly faltaPolicy = new FtFaltaPolicyService(),
    private readonly vinculoPolicy = new FtVinculoPolicyService(),
  ) {}

  async getBolsistaById(id: string) {
    try {
      const bolsista = await this.repository.findById(id);

      if (!bolsista) {
        throw ftError(404, "Bolsista not found");
      }

      return await {
        bolsista,
        ok: true,
        message: "Bolsista retrieved successfully",
        code: 200,
      };
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  async getAllBolsistas(query: FtBolsistaQueryDto = {}) {
    try {
      const { count, rows } = await this.repository.findAndCount(query);

      return await {
        code: 200,
        bolsista: rows,
        count,
        message: "Bolsistas retrieved successfully",
        ok: true,
      };
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  async getBolsistasParaVinculo(query: FtBolsistaVinculoCandidatesQueryDto) {
    try {
      const { rows, hasMore, nextCursor } =
        await this.repository.findAndCountVinculoCandidates(query);

      return await {
        code: 200,
        bolsistas: rows,
        returned_count: rows.length,
        has_more: hasMore,
        next_cursor: nextCursor,
        message: "Bolsistas para vinculo retrieved successfully",
        ok: true,
      };
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  async getAniversariantes(mes?: string | number) {
    try {
      const now = saoPauloDateParts();
      const month = mes === undefined ? now.month : Number(mes);
      if (!Number.isInteger(month) || month < 1 || month > 12)
        throw ftError(400, "Mes invalido");
      const year = now.year;
      const rows = await this.repository.findAniversariantesAtivos();
      const aniversariantes = rows.flatMap((row: any) => {
        const plain = row.toJSON?.() ?? row;
        const nascimento = plain.municipe?.nascimento;
        const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(nascimento ?? ""));
        if (!match || Number(match[2]) !== month) return [];
        const vinculo = plain.bolsistas_edital?.[0];
        return [
          {
            bolsista_id: plain.id,
            nome: plain.municipe?.nome,
            dia: Number(match[3]),
            mes: month,
            idade: year - Number(match[1]),
            edital: vinculo?.edital ?? null,
            local: vinculo?.local ?? null,
            turno: vinculo?.turno ?? null,
          },
        ];
      });
      aniversariantes.sort(
        (a: any, b: any) =>
          a.dia - b.dia ||
          String(a.nome).localeCompare(String(b.nome), "pt-BR"),
      );
      return await {
        aniversariantes,
        count: aniversariantes.length,
        mes: month,
      };
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  async saveBolsista(data: FtBolsistaDto, id?: string) {
    try {
      if (id) {
        return await this.updateBolsista(data, id);
      }

      this.policy.validateBolsistaPayload(data);
      return await this.createBolsista(data);
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  async createBolsista(data: FtBolsistaDto) {
    try {
      const paymentInfo = data?.payment_info;

      this.policy.validatePaymentInfo(paymentInfo);

      const municipe = await this.repository.findMunicipeById(
        data.municipe_uuid,
      );
      if (!municipe) {
        throw ftError(404, "Municipe not found");
      }

      const repeated = await this.repository.findByMunicipeUuid(
        data.municipe_uuid,
      );
      if (repeated) {
        throw ftError(409, "Bolsista already exists");
      }

      const { bolsista: newBolsista, paymentInfo: newPaymentInfo } =
        await this.repository.createWithPaymentInfo(
          {
            municipe_uuid: data.municipe_uuid,
          },
          {
            bco: paymentInfo.bco,
            ag: paymentInfo.ag,
            dig_ag: paymentInfo.dig_ag,
            conta: paymentInfo.conta,
            dig_conta: paymentInfo.dig_conta,
          },
        );

      const created = await this.repository.findById(newBolsista.get("id"));

      return await {
        ...(created?.toJSON?.() ?? newBolsista.toJSON()),
        payment_info: newPaymentInfo.toJSON(),
        ok: true,
        message: "Bolsista created successfully",
      };
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  async updateBolsista(data: FtBolsistaDto, id: string) {
    try {
      const { bolsista } = await this.getBolsistaById(id);
      const paymentInfo = data?.payment_info;

      this.policy.validatePaymentInfo(paymentInfo);

      const currentPaymentInfo = bolsista.get("payment_info");

      if (!currentPaymentInfo) {
        throw ftError(400, "Dados bancarios nao encontrados para o bolsista");
      }

      return await this.repository.updateWithPaymentInfo(
        bolsista,
        currentPaymentInfo,
        {
          bco: paymentInfo.bco,
          ag: paymentInfo.ag,
          dig_ag: paymentInfo.dig_ag,
          conta: paymentInfo.conta,
          dig_conta: paymentInfo.dig_conta,
        },
      );
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  async deleteBolsista(id: string) {
    try {
      const { bolsista } = await this.getBolsistaById(id);
      await this.repository.destroyBolsista(bolsista);

      return await {
        message: "Bolsista deletado com sucesso",
      };
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  async getAllToExpire() {
    try {
      const today = new Date();
      const warningDate = new Date(today.setDate(today.getDate() + 5));

      return await this.repository.findToExpire(warningDate);
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  // bolsista edital

  async prorrogate(bolsistas: FtBolsistaProrrogacaoDto[] = []) {
    try {
      if (!Array.isArray(bolsistas) || bolsistas.length === 0) {
        throw ftError(400, "Lista de bolsistas e obrigatoria");
      }

      const vinculos = [];

      for (const item of bolsistas) {
        if (!item?.bolsista_id || !item?.edital_id) {
          throw ftError(400, "Bolsista e edital sao obrigatorios");
        }

        const { bolsista } = await this.getBolsistaById(item.bolsista_id);

        if (!bolsista) {
          throw ftError(404, "Bolsista not found");
        }

        const edital = await this.repository.findEditalById(item.edital_id);
        if (!edital) {
          throw ftError(404, "Edital not found");
        }

        this.vinculoPolicy.ensureEditalAtivo(edital);

        const vinculo = await this.repository.findVinculo(
          item.bolsista_id,
          item.edital_id,
          "ativo",
        );

        if (!vinculo) {
          throw ftError(404, "Vinculo not found");
        }

        vinculos.push(vinculo);
      }

      const before = vinculos.map((item) => item.toJSON());
      await this.repository.prorrogateVinculos(vinculos);
      const after = vinculos.map((item) => item.toJSON());

      return await {
        message: "Vinculos prorrogados com sucesso",
        before,
        after,
      };
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  async getBolsistaByEditalId(id: string) {
    try {
      const bolsistas = await this.repository.findByEditalId(id);

      if (!bolsistas) {
        throw ftError(404, "Nenhum bolsista encontrado para esse edital");
      }

      return await bolsistas;
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  async getHistoricoBolsista(id: string) {
    try {
      const { bolsista } = await this.getBolsistaById(id);
      const historico = await this.repository.findHistoricoByBolsistaId(
        bolsista.get("id"),
      );

      return await {
        message: "Historico do bolsista retrieved successfully",
        historico,
        ok: true,
      };
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  async cancelBolsistaEdital(
    bolsistaId: string,
    editalId: string,
    data: FtBolsistaCancelamentoDto,
  ) {
    try {
      if (!bolsistaId || !editalId) {
        throw ftError(400, "Bolsista e edital sao obrigatorios");
      }

      const observacao = data?.observacao?.trim();
      if (!observacao) {
        throw ftError(400, "Observacao e obrigatoria");
      }

      const bolsista = await this.repository.findById(bolsistaId);
      const edital = await this.repository.findEditalById(editalId);
      const vinculo = await this.repository.findVinculo(
        bolsistaId,
        editalId,
        "ativo",
      );

      if (!bolsista || !edital || !vinculo) {
        throw ftError(404, "Bolsista ou Edital nao encontrados");
      }

      this.vinculoPolicy.ensureCanChangeVinculo(edital, vinculo);

      const before = {
        bolsista: bolsista.toJSON(),
        vinculo: vinculo.toJSON(),
      };
      await this.repository.cancelVinculo(bolsista, vinculo, observacao);
      return await {
        before,
        after: {
          bolsista: bolsista.toJSON(),
          vinculo: vinculo.toJSON(),
        },
      };
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  // faltas
  async createFalta(bolsistaId: string, data: FtBolsistaFaltaDto) {
    try {
      const { edital_id, data_falta, observacao = null } = data;

      if (!bolsistaId) {
        throw ftError(400, "Bolsista e obrigatorio");
      }

      if (!edital_id) {
        throw ftError(400, "Edital e obrigatorio");
      }

      if (!data_falta) {
        throw ftError(400, "Data da falta e obrigatoria");
      }

      if (Number.isNaN(Date.parse(String(data_falta)))) {
        throw ftError(400, "Data da falta invalida");
      }

      const bolsista = await this.repository.findById(bolsistaId);
      if (!bolsista) {
        throw ftError(404, "Bolsista not found");
      }

      const edital = await this.repository.findEditalById(edital_id);
      if (!edital) {
        throw ftError(404, "Edital not found");
      }

      const vinculo = await this.repository.findVinculo(
        bolsistaId,
        edital_id,
        "ativo",
      );
      if (!vinculo) {
        throw ftError(
          404,
          "Vinculo ativo entre bolsista e edital nao encontrado",
        );
      }

      const faltaExistente =
        await this.repository.findFaltaByBolsistaEditalData(
          bolsistaId,
          edital_id,
          data_falta,
        );

      this.faltaPolicy.ensureCanCreateFalta({
        edital,
        vinculo,
        data_falta,
        faltaExistente,
      });

      const falta = await this.repository.createFalta({
        bolsista_id: bolsistaId,
        edital_id,
        data_falta,
        observacao,
      });

      return await {
        message: "Falta lancada com sucesso",
        falta,
        ok: true,
      };
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  async listFaltas(bolsistaId: string, query: FtBolsistaFaltaQueryDto = {}) {
    try {
      const bolsista = await this.repository.findById(bolsistaId);

      if (!bolsista) {
        throw ftError(404, "Bolsista not found");
      }

      const { count, rows } =
        await this.repository.findAndCountFaltasByBolsista(bolsistaId, query);

      return await {
        message: "Faltas retrieved successfully",
        faltas: rows,
        count,
        ok: true,
      };
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  async deleteFalta(bolsistaId: string, faltaId: string) {
    try {
      const falta = await this.repository.findFaltaById(faltaId);

      if (falta?.get("bolsista_id") !== bolsistaId) {
        throw ftError(404, "Falta not found");
      }

      await this.repository.destroyFalta(falta);

      return await {
        message: "Falta deletada com sucesso",
        ok: true,
        before: falta.toJSON(),
      };
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  async createOcorrencia(
    bolsistaId: string,
    data: FtBolsistaOcorrenciaDto,
    authorId: number,
  ) {
    try {
      const vinculoId = data?.bolsista_edital_id;
      const descricao = String(data?.descricao ?? "").trim();
      const date = String(data?.data_ocorrencia ?? "");
      if (!bolsistaId || !vinculoId || !descricao || !date)
        throw ftError(
          400,
          "Bolsista, vinculo, data e descricao sao obrigatorios",
        );
      if (descricao.length > 2000)
        throw ftError(400, "Descricao deve ter no maximo 2000 caracteres");
      const parsedDate = new Date(`${date}T00:00:00.000Z`);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== date
      )
        throw ftError(400, "Data da ocorrencia invalida");
      const today = todayInSaoPaulo();
      if (date.slice(0, 10) > today)
        throw ftError(400, "Data da ocorrencia nao pode ser futura");
      if (!(await this.repository.findById(bolsistaId)))
        throw ftError(404, "Bolsista not found");
      const vinculo = await this.repository.findVinculoById(vinculoId);
      if (!vinculo || String(vinculo.get("bolsista_id")) !== bolsistaId) {
        throw ftError(404, "Vinculo do bolsista nao encontrado");
      }
      const ocorrencia = await this.repository.createOcorrencia({
        bolsista_edital_id: vinculo.get("id"),
        data_ocorrencia: date.slice(0, 10),
        descricao,
        author_id: authorId,
      });
      return await {
        message: "Ocorrencia registrada com sucesso",
        ocorrencia,
        ok: true,
      };
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  async listOcorrencias(
    bolsistaId: string,
    query: FtBolsistaOcorrenciaQueryDto = {},
  ) {
    try {
      if (!(await this.repository.findById(bolsistaId)))
        throw ftError(404, "Bolsista not found");
      const { count, rows } =
        await this.repository.findAndCountOcorrenciasByBolsista(
          bolsistaId,
          query,
        );
      return await {
        message: "Ocorrencias retrieved successfully",
        ocorrencias: rows,
        count,
        ok: true,
      };
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  async deleteOcorrencia(bolsistaId: string, ocorrenciaId: string) {
    try {
      const ocorrencia = await this.repository.findOcorrenciaById(ocorrenciaId);
      const vinculo = ocorrencia?.get?.("vinculo");
      if (!ocorrencia || vinculo?.get?.("bolsista_id") !== bolsistaId)
        throw ftError(404, "Ocorrencia not found");
      const before = ocorrencia.toJSON();
      await this.repository.destroyOcorrencia(ocorrencia);
      return await {
        message: "Ocorrencia removida com sucesso",
        ok: true,
        before,
      };
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
}
