import {
  getAll,
  getOne,
  // getAllUserService,
  create,
  update,
  deleteOne,
} from "./service.js";

export default class Services {
  static getService = async (request, reply) => {
    try {
      const services = await getAll();
      return reply.status(200).send({ services });
    } catch (error) {
      throw {
        code: error.code,
        message: error.message,
        ok: false,
        api: "Services",
      };
    }
  };

  static getOneService = async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      const service = await getOne(id);
      return reply.status(200).send({ service });
    } catch (error) {
      throw {
        code: error.code,
        message: error.message,
        ok: false,
        api: "Services",
      };
    }
  };

  static createService = async (request, reply) => {
    try {
      const service = await create(request.body.service);
      return reply.status(201).send({ service });
    } catch (error) {
      throw {
        code: error.code,
        message: error.message,
        ok: false,
        api: "Services",
      };
    }
  };

  static updateService = async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      await update(id, request.body.service);
      reply.status(204).send();
    } catch (error) {
      throw {
        code: error.code,
        message: error.message,
        ok: false,
        api: "Services",
      };
    }
  };

  static deleteService = async (request, reply) => {
    try {
      const id = parseInt(request.params.id);

      if (id <= 3) {
        throw {
          code: 403,
          ok: false,
          api: "Services",
          message: "Não é possível deletar esse serviço",
        };
      }

      const deletedCount = await deleteOne(id);

      if (deletedCount < 1) {
        throw {
          code: 404,
          ok: false,
          api: "Services",
          message: "Serviço não encontrado",
        };
      }

      reply.status(204).send();
    } catch (error) {
      throw {
        code: error.code,
        message: error.message,
        ok: false,
        api: "Services",
      };
    }
  };
}
