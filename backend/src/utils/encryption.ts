import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_encryption_key_32chars!!';

export const encrypt = (text: string): string => {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

export const decrypt = (encryptedText: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const hashSensitiveData = (data: string): string => {
  return CryptoJS.SHA256(data + ENCRYPTION_KEY).toString();
};

export const maskFinancialData = (amount: number): string => {
  return `****${amount.toString().slice(-2)}`;
};

