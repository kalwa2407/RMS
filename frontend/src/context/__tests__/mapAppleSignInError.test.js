import { mapAppleSignInError } from '../CustomerAuthContext';

jest.mock('../../firebase', () => ({ auth: {}, googleProvider: {}, appleProvider: {} }));
jest.mock('firebase/auth', () => ({ setPersistence: () => Promise.resolve() }));
jest.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false, getPlatform: () => 'web' } }));

const appleErr = (n) => ({
  message: `The operation couldn't be completed. (com.apple.AuthenticationServices.AuthorizationError error ${n}.)`,
});

describe('mapAppleSignInError', () => {
  test('1001 (user cancel) is silent', () => {
    expect(mapAppleSignInError(appleErr(1001))).toEqual({ cancelled: true, message: null, appleCode: 1001 });
  });

  test.each([1000, 1002, 1003, 1004, 1005, 1006])('%i shows friendly message, never raw text', (n) => {
    const r = mapAppleSignInError(appleErr(n));
    expect(r.cancelled).toBe(false);
    expect(r.appleCode).toBe(n);
    expect(r.message).toMatch(/Sign in with Apple couldn't be completed/);
    expect(r.message).not.toMatch(/AuthorizationError|com\.apple/);
  });

  test('web popup closed is silent', () => {
    expect(mapAppleSignInError({ code: 'auth/popup-closed-by-user' }).cancelled).toBe(true);
  });

  test('known Firebase codes get specific messages', () => {
    expect(mapAppleSignInError({ code: 'auth/network-request-failed' }).message).toMatch(/internet/);
    expect(mapAppleSignInError({ code: 'auth/account-exists-with-different-credential' }).message).toMatch(/already exists/);
  });

  test('unknown / empty errors fall back to generic message', () => {
    expect(mapAppleSignInError(new Error('Apple Sign-In returned no user.')).message).toMatch(/Apple Account in Settings/);
    expect(mapAppleSignInError(undefined).message).toMatch(/Apple Account in Settings/);
  });
});
