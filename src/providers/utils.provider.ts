import bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import type { Optional } from '../types';

export class UtilsProvider {
  /**
   * generate hash from password or string
   * @param {string} password
   * @returns {string}
   */
  static generateHash(password: string): string {
    return bcrypt.hashSync(password, 12);
  }

  /**
   * generate random string
   * @param length
   */
  static generateRandomString(length: number): string {
    return Math.random()
      .toString(36)
      .replace(/[^\dA-Za-z]+/g, '')
      .slice(0, Math.max(0, length));
  }

  /**
   * generate random string
   * @param length
   */
  static generateRandomToken(): string {
    return crypto.randomBytes(20).toString('hex');
  }

  /**
   * validate text with hash
   * @param {string} password
   * @param {string} hash
   * @returns {Promise<boolean>}
   */
  static validateHash(
    password: string,
    hash: Optional<string>,
  ): Promise<boolean> {
    if (!password || !hash) {
      return Promise.resolve(false);
    }

    return bcrypt.compare(password, hash);
  }
}
