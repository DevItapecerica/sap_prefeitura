import type { TransactionalAuditFactory } from "./transactional-audit.js";
import type { Transaction } from "sequelize";
import type { DbObject } from "../../../../core/types/DbTypes.js";
import type { IAesCrypt } from "../../../../core/security/aes/AesCrypt.interface.js";
import type { AuditService } from "../../../../modules/audit/application/use-case/audit.service.js";
import type { AuditCommand } from "../../../../modules/audit/domain/entity/audit-command.js";
import type {
  PayrollProgram,
  PayrollClosure,
  PayrollSnapshot,
  PayrollPeriod,
  PayrollReader,
  PayrollTransaction,
  PayrollUnitOfWork,
} from "../../../../modules/ft-relatorio/domain/repositories/payroll-unit-of-work.js";

type Calculate = (
  id: string,
  period: PayrollPeriod,
  transaction?: Transaction,
) => Promise<PayrollSnapshot>;

/** Encrypted snapshots retain the exact legacy JSON/CSV representation. */
function snapshot(value: unknown): PayrollSnapshot {
  if (
    !value ||
    typeof value !== "object" ||
    !("rows" in value) ||
    !Array.isArray(value.rows) ||
    !("csv" in value) ||
    typeof value.csv !== "string" ||
    !("versao" in value) ||
    typeof value.versao !== "string"
  ) {
    throw new Error("Invalid stored payroll snapshot");
  }
  return value as PayrollSnapshot;
}

export class SequelizePayrollRepository implements PayrollTransaction {
  constructor(
    private db: DbObject,
    private calculator: Calculate,
    private crypto: IAesCrypt,
    private audit?: Pick<AuditService, "record">,
    private transaction?: Transaction,
  ) {}
  async program(id: string): Promise<PayrollProgram | null> {
    const row = await this.db.Edital.findByPk(id, {
      transaction: this.transaction,
      ...(this.transaction ? { lock: this.transaction.LOCK.UPDATE } : {}),
    });
    if (!row) return null;
    return {
      data_publicacao: row.data_publicacao,
      data_vencimento: row.data_vencimento,
      vigencia_inicio: row.vigencia_inicio,
    };
  }
  async closure(
    editalId: string,
    month: string,
  ): Promise<PayrollClosure | null> {
    const row = await this.db.FtFolhaFechamento.findOne({
      where: { edital_id: editalId, mes: month },
      transaction: this.transaction,
    });
    if (!row) return null;
    return {
      id: row.id,
      edital_id: row.edital_id,
      mes: row.mes,
      versao: row.versao,
      fechado_por: row.fechado_por,
      fechado_em: row.fechado_em,
      snapshot: snapshot(JSON.parse(await this.crypto.decrypt(row.snapshot))),
    };
  }
  async actorName(id: string): Promise<string | null> {
    const actor = await this.db.UserModel.findByPk(id, {
      attributes: ["id", "name"],
      paranoid: false,
      transaction: this.transaction,
    });
    return actor?.name || null;
  }
  calculate(id: string, period: PayrollPeriod) {
    return this.calculator(id, period, this.transaction);
  }
  async createClosure(
    input: Omit<PayrollClosure, "id">,
  ): Promise<PayrollClosure> {
    const row = await this.db.FtFolhaFechamento.create(
      {
        ...input,
        snapshot: await this.crypto.encrypt(JSON.stringify(input.snapshot)),
      },
      { transaction: this.transaction },
    );
    return { ...input, id: row.id };
  }
  async recordAudit(input: AuditCommand) {
    if (!this.audit) throw new Error("Payroll audit adapter not configured");
    await this.audit.record(input);
  }
}

export class SequelizePayrollUnitOfWork implements PayrollUnitOfWork {
  readonly read: PayrollReader;
  constructor(
    private db: DbObject,
    private calculator: Calculate,
    private crypto: IAesCrypt,
    private audit: TransactionalAuditFactory,
  ) {
    this.read = new SequelizePayrollRepository(db, calculator, crypto);
  }
  run<T>(work: (ports: PayrollTransaction) => Promise<T>) {
    return this.db.sequelize.transaction((transaction) =>
      work(
        new SequelizePayrollRepository(
          this.db,
          this.calculator,
          this.crypto,
          this.audit(transaction),
          transaction,
        ),
      ),
    );
  }
}
