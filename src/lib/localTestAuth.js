export const LOCAL_TEST_ACCOUNT = {
  id: 'local-test-user-001',
  email: 'teste@qgdaprf.local',
  password: 'Teste@2026',
  displayName: 'Recruta Teste (Local)',
};

export const LOCAL_TEST_SESSION_KEY = 'qg_local_test_session_v1';

export function isLocalTestUser(userOrSession) {
  const userObj = userOrSession?.user || userOrSession;
  if (!userObj || typeof userObj !== 'object') return false;
  return Boolean(
    userOrSession?.isLocalTest ||
    userObj.id === LOCAL_TEST_ACCOUNT.id ||
    String(userObj.email || '').toLowerCase() === LOCAL_TEST_ACCOUNT.email
  );
}

export function matchesLocalTestCredentials(rawEmail, rawPassword) {
  const cleanEmail = String(rawEmail || '').trim().toLowerCase();
  const cleanPassword = String(rawPassword || '');
  return (
    (cleanEmail === LOCAL_TEST_ACCOUNT.email || cleanEmail === LOCAL_TEST_ACCOUNT.id) &&
    cleanPassword === LOCAL_TEST_ACCOUNT.password
  );
}

export function createLocalTestSession() {
  return {
    access_token: null,
    isLocalTest: true,
    user: {
      id: LOCAL_TEST_ACCOUNT.id,
      email: LOCAL_TEST_ACCOUNT.email,
      user_metadata: {
        display_name: LOCAL_TEST_ACCOUNT.displayName,
      },
    },
  };
}

export function hasStoredLocalTestSession() {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(LOCAL_TEST_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function persistLocalTestSession(enabled) {
  try {
    if (typeof localStorage === 'undefined') return;
    if (enabled) {
      localStorage.setItem(LOCAL_TEST_SESSION_KEY, 'true');
    } else {
      localStorage.removeItem(LOCAL_TEST_SESSION_KEY);
    }
  } catch {
    // ignore storage restrictions
  }
}
