import { IBcrypt } from "../../../../core/security/bcrypt/bcrypt.interface.js";
import { PasswordGenerator } from "../../../../core/security/password/password-generator.interface.js";
import { User } from "../../domain/entity/User.js";
import { UserQuery } from "../dto/user-query.dto.js";
import UserRepository from "../../domain/repository/user.repository.js";
import { UserPasswordNotifier } from "../../domain/repository/user-password-notifier.repository.js";
import { CreateUserDto } from "../dto/create-user.dto.js";

export const userPayload: CreateUserDto = {
  name: "User",
  email: "user@itapecerica.sp.gov.br",
  ramal: "1",
  setor_id: 1,
  role_id: 1,
};

export class FakeUserRepository implements UserRepository {
  users = new Map<number, User>();
  duplicatedEmail = false;
  lastQuery?: UserQuery;
  createdPassword?: string;

  constructor(private readonly operations?: string[]) {}

  getAllUser(query: UserQuery) {
    this.lastQuery = query;
    return Promise.resolve({ user: [...this.users.values()], count: this.users.size });
  }

  getUserById(id: number) {
    return Promise.resolve(this.users.get(id) ?? null);
  }

  getUserByEmail(email: string, excludeId?: number) {
    if (this.duplicatedEmail) {
      return Promise.resolve(new User("Duplicado", email, "1", 1, 1, 99));
    }
    return Promise.resolve(
      [...this.users.values()].find(
        (user) => user.email === email && user.id !== excludeId,
      ) ?? null,
    );
  }

  createUser(data: User, password: string) {
    this.operations?.push("persist");
    this.createdPassword = password;
    const user = new User(
      data.name,
      data.email,
      data.ramal,
      data.setor_id,
      data.role_id,
      1,
      false,
      password,
    );
    this.users.set(1, user);
    return Promise.resolve(user);
  }

  updateUser(id: number, data: User) {
    const current = this.users.get(id)!;
    const updated = new User(
      data.name,
      data.email,
      data.ramal,
      data.setor_id,
      data.role_id,
      id,
      current.firstLogin,
      current.password,
    );
    this.users.set(id, updated);
    return Promise.resolve(updated);
  }

  alterarUserSenha(id: number, password: string) {
    this.users.get(id)!.password = password;
    return Promise.resolve(true);
  }

  deleteUser(id: number) {
    return Promise.resolve(this.users.delete(id));
  }
}

export class FakeBcrypt implements IBcrypt {
  constructor(private readonly operations?: string[]) {}

  hash(password: string): Promise<string> {
    this.operations?.push("hash");
    return Promise.resolve(`hashed:${password}`);
  }

  compare(password: string, hash: string): Promise<boolean> {
    return Promise.resolve(hash === `hashed:${password}`);
  }
}

export class FakePasswordGenerator implements PasswordGenerator {
  constructor(
    private readonly password = "Temporaria1",
    private readonly operations?: string[],
  ) {}
  generate(): string {
    this.operations?.push("generate");
    return this.password;
  }
}

export class FakePasswordNotifier implements UserPasswordNotifier {
  sent: Array<{ email: string; password: string }> = [];

  constructor(private readonly operations?: string[]) {}

  sendTemporaryPassword(email: string, password: string): Promise<void> {
    this.operations?.push("notify");
    this.sent.push({ email, password });
    return Promise.resolve();
  }
}
