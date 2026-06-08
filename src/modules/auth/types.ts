export interface AuthLoginResponse {
  user: {
    id: number;
    name: string;
    role_id: number;
    setor_id: number;
  };
  token: string;
  refreshToken: string;
}

export type JwtUserPayload = {
  id: number
  name: string
  role_id: number
  setor_id: number
}

export type RefreshSessionResponse = {
  token: string;
  refreshToken: string;
};
