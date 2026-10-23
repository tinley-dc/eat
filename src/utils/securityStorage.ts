export interface SecurityConfig {
  passwordHash: string;
  salt: string;
  updatedAt: number;
}

const STORAGE_KEY = 'wanna_eat_security_config_v1';
const REMEMBERED_KEY = 'wanna_eat_device_remembered_v1';

/**
 * 產生 16 位元組隨機 Salt
 */
export function generateSalt(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * 使用 SHA-256 加鹽雜湊密碼（不可逆單向加密）
 */
export async function hashPasswordWithSalt(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${password.trim()}`);
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // 極端降級備案（一般現代瀏覽器皆支援 Web Crypto API）
  let hash = 0;
  const str = `${salt}:${password}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

/**
 * 讀取本機快取的安全設定
 */
export function getSecurityConfig(): SecurityConfig | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.passwordHash === 'string') {
      return parsed as SecurityConfig;
    }
  } catch (e) {
    console.warn('解析安全設定失敗:', e);
  }
  return null;
}

/**
 * 儲存安全設定至本機快取
 */
export function saveSecurityConfig(config: SecurityConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent('security-config-updated', { detail: config }));
}

/**
 * 是否已經設定過管理密碼
 */
export function hasPasswordConfigured(): boolean {
  const config = getSecurityConfig();
  return !!(config && config.passwordHash);
}

/**
 * 設定新密碼並返回安全設定
 */
export async function setupPassword(password: string): Promise<SecurityConfig> {
  const salt = generateSalt();
  const hash = await hashPasswordWithSalt(password, salt);
  const config: SecurityConfig = {
    passwordHash: hash,
    salt,
    updatedAt: Date.now()
  };
  saveSecurityConfig(config);
  return config;
}

/**
 * 驗證使用者輸入的密碼
 */
export async function verifyPassword(password: string): Promise<boolean> {
  const config = getSecurityConfig();
  if (!config || !config.passwordHash) return false;
  const computedHash = await hashPasswordWithSalt(password, config.salt || '');
  return computedHash === config.passwordHash;
}

/**
 * 檢查這台裝置是否被記住（免重複輸入密碼）
 */
export function isDeviceRemembered(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(REMEMBERED_KEY) === 'true';
}

/**
 * 設定或清除「在這台裝置記住我」
 */
export function setDeviceRemembered(remember: boolean): void {
  if (typeof window === 'undefined') return;
  if (remember) {
    localStorage.setItem(REMEMBERED_KEY, 'true');
  } else {
    localStorage.removeItem(REMEMBERED_KEY);
  }
}
