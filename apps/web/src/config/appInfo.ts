import packageJson from '../../package.json';

export const appVersion = packageJson.version;

export function getCurrentYear() {
  return new Date().getFullYear();
}
