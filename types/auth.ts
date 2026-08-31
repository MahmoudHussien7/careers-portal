export type UserRole =
  | "admin"
  | "marketing"
  | "seo"
  | "sales-admin"
  | "hr-admin"
  | "senior-recruiter"
  | "recruiter"
  | "office-admin";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleSlug: UserRole;
  roleName: string;
  permissions: string[];
}

export interface LoginResponse {
  status: string;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface MeResponse {
  status: string;
  data: {
    user: User;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/** Rules from GET /api/admin/auth/password-policy */
export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialCharacter: boolean;
  /** Optional human-readable rules from the API */
  rules?: string[];
}

export interface PasswordPolicyResponse {
  status: string;
  data: PasswordPolicy & { policy?: PasswordPolicy };
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  refreshToken: string;
}

export interface ChangePasswordResponse {
  status: string;
  message: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
  };
}

