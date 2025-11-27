import type { User } from "@/types/user.types";
export const TokenStorage = {
  getAccessToken: (): string | null => localStorage.getItem("accessToken"),
  setAccessToken: (token: string): void => localStorage.setItem("accessToken", token),

  getRefreshToken: (): string | null => localStorage.getItem("refreshToken"),
  setRefreshToken: (token: string): void => localStorage.setItem("refreshToken", token),

  getUser: (): User | null => {
    try {
      const user = localStorage.getItem("user");
      if (!user) return null;
      return JSON.parse(user) as User;
    } catch {
      return null;
    }
  },
  setUser: (user: User): void => localStorage.setItem("user", JSON.stringify(user)),

  getIdToken: (): string | null => localStorage.getItem("idToken"),
  setIdToken: (token: string): void => localStorage.setItem("idToken", token),

  clearTokens: (): void => {
    ["accessToken", "refreshToken", "user", "idToken"].forEach((key) =>
      localStorage.removeItem(key)
    );
  },
};
