export interface IEditalRepository {
    save(edital: any): Promise<any>;
    findById(id: string): Promise<any>;
    findAll(): Promise<any>;
    update(id: string, edital: any): Promise<any>;
    delete(id: string): Promise<boolean>;
}