const componentPattern = /^[a-z][a-z0-9_]*$/;

export function permissionKey(module: string, action: string): string {
  if (typeof module !== 'string' || typeof action !== 'string' ||
      !componentPattern.test(module) || module.length > 64 ||
      !componentPattern.test(action) || action.length > 96) {
    throw new TypeError('Invalid permission key');
  }
  return `${module}:${action}`;
}
