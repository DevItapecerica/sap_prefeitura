import AppError from "../../core/appError.js";
import { QueryParams } from "../../core/shared/types/genericTypes.js";
import { CreateServicesDto, UpdateServicesDto } from "./dto/services.dto.js";
import { ServicesRepository } from "./services.repository.js";

export default class ServicesService {
  constructor(private repo: ServicesRepository){}
  getAll = async (query: QueryParams) => {

    return await this.repo.getAllServices(query);
  };

  getOne = async (id: number) => {
    return await this.repo.getOneServices(id);
  };

  create = async (service: CreateServicesDto) => {
    const newService = await this.repo.createServices(service);
    return newService;
  };

  deleteOne = async (id: number) => {
    const deletedCount = await this.repo.deleteOneServices(id);

    if (!deletedCount) {
      throw new AppError("Service not found", 404, "SERVICE_NOT_FOUND");
    }

    return deletedCount;
  };

  update = async (id: number, service: UpdateServicesDto) => {
    const updatedCount = await this.repo.updateServices(id, service);
        if (!updatedCount) {
      throw new AppError("Service not found", 404, "SERVICE_NOT_FOUND");
    }
    return updatedCount;
  };
}
