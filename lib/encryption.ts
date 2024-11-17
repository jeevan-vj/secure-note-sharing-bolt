import CryptoJS from 'crypto-js';
import forge from 'node-forge';

export type EncryptionAlgorithm = 'AES-256' | 'RSA-2048';

interface EncryptionOptions {
  algorithm: EncryptionAlgorithm;
  recipientEmail?: string;
}

export function generateKeyPair() {
  const rsa = forge.pki.rsa;
  const keypair = rsa.generateKeyPair({ bits: 2048, workers: 2 });
  return {
    publicKey: forge.pki.publicKeyToPem(keypair.publicKey),
    privateKey: forge.pki.privateKeyToPem(keypair.privateKey),
  };
}

export function encryptNote(
  content: string,
  password?: string,
  options?: EncryptionOptions
) {
  const algorithm = options?.algorithm || 'AES-256';
  
  if (algorithm === 'RSA-2048') {
    const { publicKey, privateKey } = generateKeyPair();
    const encrypted = forge.util.encode64(
      forge.pki.publicKeyFromPem(publicKey).encrypt(content)
    );
    
    return {
      encryptedData: encrypted,
      key: privateKey,
      algorithm,
      isPasswordProtected: !!password,
    };
  }
  
  // Default to AES-256
  const key = CryptoJS.lib.WordArray.random(32).toString();
  
  // If password is provided, use it to encrypt the content first
  const encryptedContent = password 
    ? CryptoJS.AES.encrypt(content, password).toString()
    : content;
    
  // Then encrypt with the one-time key
  const encryptedData = CryptoJS.AES.encrypt(encryptedContent, key).toString();
  
  return { 
    encryptedData, 
    key,
    algorithm,
    isPasswordProtected: !!password 
  };
}

export function decryptNote(
  encryptedData: string,
  key: string,
  algorithm: EncryptionAlgorithm = 'AES-256',
  password?: string
) {
  try {
    if (algorithm === 'RSA-2048') {
      const privateKey = forge.pki.privateKeyFromPem(key);
      const decrypted = privateKey.decrypt(
        forge.util.decode64(encryptedData)
      );
      return decrypted;
    }
    
    // AES-256 decryption
    const decryptedWithKey = CryptoJS.AES.decrypt(encryptedData, key);
    const content = decryptedWithKey.toString(CryptoJS.enc.Utf8);
    
    if (password) {
      const decryptedWithPassword = CryptoJS.AES.decrypt(content, password);
      const finalContent = decryptedWithPassword.toString(CryptoJS.enc.Utf8);
      
      if (!finalContent) {
        throw new Error('Incorrect password');
      }
      
      return finalContent;
    }
    
    return content;
  } catch (error) {
    if (error.message === 'Incorrect password') {
      throw error;
    }
    throw new Error('Failed to decrypt note');
  }
}