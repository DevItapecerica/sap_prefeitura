import { Permissions } from "../../../permission/domain/entity/Permission.js";
import { Services } from "../../domain/entity/Services.js";

export type VisibleServiceDto = Services & { permissions: Permissions[] };
