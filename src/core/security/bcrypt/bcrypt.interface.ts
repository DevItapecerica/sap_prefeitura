export interface IBcrypt {
  hash(password: string, salt?: number): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}
