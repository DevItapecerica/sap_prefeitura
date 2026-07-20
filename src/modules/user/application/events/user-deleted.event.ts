import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { User } from "../../domain/entity/User.js";

export interface UserDeletedEvent {
  context: ApplicationEventContext;
  before: User;
}
