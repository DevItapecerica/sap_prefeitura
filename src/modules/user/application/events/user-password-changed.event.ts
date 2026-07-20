import { ApplicationEventContext } from "../../../../core/event/application-event.js";

export interface UserPasswordChangedEvent {
  context: ApplicationEventContext;
  userId: number | string;
}
