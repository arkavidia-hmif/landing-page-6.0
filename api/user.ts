import { ApiError, ArkavidiaBaseApi } from '~/api/base';

export interface User {
  email: string;
  fullName: string;
  currentEducation?: string;
  institution?: string;
  phoneNumber?: string;
  dateJoined: number;
  birthDate?: string;
  address?: string;
}

export enum RegistrationStatus {
  EMAIL_EXISTS, ERROR
}

export enum LoginStatus {
  INVALID_CREDS, ERROR, EMAIL_NOT_CONFIRMED
}

export enum EmailOperationStatus {
  INVALID_TOKEN, ERROR
}

export interface AuthenticationResult {
  user: User;
  bearerToken: string;
  expiresAt: number
}

export class ArkavidiaUserApi extends ArkavidiaBaseApi {
  async login(email: string, password: string): Promise<AuthenticationResult> {
    try {
      const data = { email, password };
      const response = await this.axios.post(`/api/auth/login/`, data);

      return {
        bearerToken: response.data.token,
        expiresAt: response.data.exp * 1000,
        user: response.data.user as User
      };
    }
    catch (e) {
      if (e.response) {
        const errorCode = e.response.data.code;
        if (errorCode === 'login_failed' || errorCode === 'unknown_error') {
          throw new ApiError<LoginStatus>(LoginStatus.INVALID_CREDS, e.response.data.detail);
        }
        else if (errorCode === 'account_email_not_confirmed') {
          throw new ApiError<LoginStatus>(LoginStatus.EMAIL_NOT_CONFIRMED, e.response.data.detail);
        }
      }

      throw new ApiError<LoginStatus>(LoginStatus.ERROR, e.toString());
    }
  }

  async register(email: string, fullName: string, password: string): Promise<void> {
    try {
      const data = { email, password, fullName };
      await this.axios.post(`/api/auth/register/`, data);
    }
    catch (e) {
      if (e.response) {
        if (e.response.data.code === 'unknown_error') {
          throw new ApiError<RegistrationStatus>(RegistrationStatus.EMAIL_EXISTS, e.response.data.detail);
        }
      }

      throw new ApiError<RegistrationStatus>(RegistrationStatus.ERROR, e.toString());
    }
  }

  async recover(email: string): Promise<void> {
    try {
      const data = { email };
      await this.axios.post(`/api/auth/password-reset/`, data);
    }
    catch (e) {
      throw new ApiError<boolean>(false, e.toString());
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const data = { token, newPassword };
      await this.axios.post(`/api/auth/confirm-password-reset/`, data);
    }
    catch (e) {
      if (e.response) {
        if (e.response.data.code === 'invalid_token') {
          throw new ApiError<EmailOperationStatus>(EmailOperationStatus.INVALID_TOKEN, e.response.data.detail);
        }
      }

      throw new ApiError<EmailOperationStatus>(EmailOperationStatus.ERROR, e.toString());
    }
  }

  async confirmEmailAddress(token: string): Promise<void> {
    try {
      const data = { token };
      await this.axios.post(`/api/auth/confirm-registration/`, data);
    }
    catch (e) {
      if (e.response) {
        if (e.response.data.code === 'invalid_token') {
          throw new ApiError<EmailOperationStatus>(EmailOperationStatus.INVALID_TOKEN, e.response.data.detail);
        }
      }

      throw new ApiError<EmailOperationStatus>(EmailOperationStatus.ERROR, e.toString());
    }
  }
}
