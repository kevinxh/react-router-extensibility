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
