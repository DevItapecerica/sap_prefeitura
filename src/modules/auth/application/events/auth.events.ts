import { ApplicationEventContext } from "../../../../core/event/application-event.js";

export const AUTH_EVENTS = {
  loginSucceeded: "AUTH_LOGIN_SUCCEEDED",
  logoutSucceeded: "AUTH_LOGOUT_SUCCEEDED",
} as const;

export interface AuthLoginSucceededEvent {
  context: ApplicationEventContext;
}

export interface AuthLogoutSucceededEvent {
  context: ApplicationEventContext;
  userId: number | null;
}

export interface AuthEventMap {
  [AUTH_EVENTS.loginSucceeded]: AuthLoginSucceededEvent;
  [AUTH_EVENTS.logoutSucceeded]: AuthLogoutSucceededEvent;
}
