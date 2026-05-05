export interface ISha256Crypt {
    encrypt(text: string): Promise<string>;
    compare(text: string, hash: string): Promise<boolean>;
}