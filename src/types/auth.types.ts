// User Interface
import type { User } from "@/types/user.types";

export interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Redux State
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
