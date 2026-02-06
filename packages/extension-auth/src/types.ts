/**
 * The context value provided by extension-auth.
 * Use with `getExtensionContext<AuthContextValue>(context, "extension-auth")`.
 */
export interface AuthContextValue {
  currentUser: {
    id: string;
    name: string;
    role: string;
  } | null;
}

/**
 * Server-side actions provided by extension-auth.
 * Use with `getExtensionActions<AuthActions>(context, "extension-auth")`.
 */
export interface AuthActions {
  login: (username: string, password: string) => Promise<{ success: boolean; user: AuthContextValue["currentUser"] }>;
  logout: () => Promise<{ success: boolean }>;
  getSession: () => Promise<AuthContextValue>;
}
