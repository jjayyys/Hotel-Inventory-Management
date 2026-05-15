export type AuthUser = {
  sub: string;
  email: string;
  name: string;
  role: string;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};
