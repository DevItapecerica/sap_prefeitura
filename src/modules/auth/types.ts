export interface AuthLoginResponse {
  user: {
    id: number;
    name: string;
    role_id: number;
    setor_id: number;
  };
  token: string;
}

export type JwtUserPayload = {
  id: number
  name: string
  role_id: number
  setor_id: number
}