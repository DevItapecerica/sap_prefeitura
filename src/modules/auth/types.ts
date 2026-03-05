export interface AuthLoginResponse {
  user: {
    id: number;
    name: string;
    role_id: number;
    setor_id: number;
  };
}

export type JwtUserPayload = {
  id: number
  name: string
  role_id: number
  setor_id: number
}