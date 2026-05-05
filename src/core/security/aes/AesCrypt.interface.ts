export interface IAesCrypt {
    encrypt(text: string): Promise<string>;
    decrypt(text: string): Promise<string>;
}