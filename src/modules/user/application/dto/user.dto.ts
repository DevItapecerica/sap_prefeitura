export type UserId = number;

export type CreateUserDto = {
  name: string;
  email: string;
  ramal: string;
  setor_id: number;
  role_id: number;
};

export type UpdateUserDto = CreateUserDto;
