import { Services } from "../entity/Services.js";

export interface ServiceListResult {
  services: Services[];
  count: number;
}
