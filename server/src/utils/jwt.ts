import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { IUserPayload } from '../types';

export const signToken = (payload: IUserPayload): string => {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN as any,
  });
};

export const verifyToken = (token: string): IUserPayload => {
  return jwt.verify(token, ENV.JWT_SECRET) as IUserPayload;
};
