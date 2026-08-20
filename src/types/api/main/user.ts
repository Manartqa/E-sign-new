export interface UserResponse {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  avatarUrl?: string;
}

export interface LoginRequest {
  username: string;
  pwd: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserResponse;
}
