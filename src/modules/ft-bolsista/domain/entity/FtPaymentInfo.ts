export class FtPaymentInfo {
  constructor(
    public readonly bco: string,
    public readonly pagador_id: string,
    public readonly ag: string,
    public readonly dig_ag: string,
    public readonly conta: string,
    public readonly dig_conta: string,
    public readonly id?: string,
    public readonly bolsista_id?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly deletedAt?: Date | null,
  ) {}
}
