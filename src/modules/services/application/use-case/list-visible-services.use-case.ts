export interface VisibleServicesRepository {
  visibleServices(userId: number): Promise<Record<string, unknown>[]>;
}
export class ListVisibleServicesUseCase {
  constructor(private readonly repository: VisibleServicesRepository) {}
  execute(userId: number) { return this.repository.visibleServices(userId); }
}
