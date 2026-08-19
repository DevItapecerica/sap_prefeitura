import { ServiceAggregateDto } from "./service-aggregate.dto.js";

export interface DeleteServiceResultDto {
  before: ServiceAggregateDto;
  after: null;
}
