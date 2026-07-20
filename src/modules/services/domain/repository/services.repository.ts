import { Services } from "../entity/Services.js";
import { ServiceListResult } from "./service-list-result.js";
import { ServiceQuery } from "./service-query.js";

export type ServiceWriteData = Pick<
  Services,
  "name" | "description" | "tag" | "url"
>;

export interface ServicesRepository {
  getAllServices(query: ServiceQuery): Promise<ServiceListResult>;
  getOneServices(id: number): Promise<Services | null>;
  createServices(service: ServiceWriteData): Promise<Services>;
}
