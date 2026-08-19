export interface AuthLoginResponse {
  user: {
    id: number;
    name: string;
    role_id: number;
    setor_id: number | null;
  };
  token: string;
  refreshToken: string;
}

export type JwtUserPayload = {
  id: number
  name: string
  role_id: number
  setor_id: number | null
}

export type RefreshSessionResponse = {
  token: string;
  refreshToken: string;
};
