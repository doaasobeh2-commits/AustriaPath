/**
 * Password-reset deep link should open even when a session cookie exists.
 * @param {{ type?: string, token?: string } | null | undefined} authTokenAction
 */
export function shouldShowResetPasswordScreen(authTokenAction) {
  return authTokenAction?.type === "reset" && Boolean(authTokenAction?.token);
}
