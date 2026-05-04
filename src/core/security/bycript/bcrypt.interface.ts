export interface IBcrypt {
    hashSync(password: string, salt?: number): Promise<string>;
    compareSync(password: string, hash: string): Promise<boolean>;
}