import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { User } from "../../domain/entity/User.js";

export interface UserCreatedEvent {
  context: ApplicationEventContext;
  user: User;
}
