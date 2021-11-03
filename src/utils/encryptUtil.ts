import CryptoJS from 'crypto-js';

export const aesEncrypt = (content: string, passphrase: string): string => {
  const encrypted = CryptoJS.AES.encrypt(content, passphrase, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 });
  return encrypted.toString();
};

export const aesDecrypt = (encodeContent: string, passphrase: string): string => {
  const decrypt = CryptoJS.AES.decrypt(encodeContent, passphrase,
    { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 });
  return decrypt.toString(CryptoJS.enc.Utf8);
};
