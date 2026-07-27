import { ServiceAggregateDto } from "./service-aggregate.dto.js";

export interface UpdateServiceResultDto {
  before: ServiceAggregateDto;
  after: ServiceAggregateDto;
}
