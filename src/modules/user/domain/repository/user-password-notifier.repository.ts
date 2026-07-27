export interface UserPasswordNotifier {
  sendTemporaryPassword(email: string, password: string): Promise<void>;
}
