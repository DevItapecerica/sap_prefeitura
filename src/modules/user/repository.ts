import db from "../../db/db.js";
import { userParams, userRequired } from "../../types/userType.js";



export default class UserRepository {
    static create = (user: userRequired, password: string) => {
         const payload = {
            name: user.name,
            email: user.email,
            ramal: user.ramal,
            password: password,
            setor_id: user.setor_id,
            firstLogin: user.firstLogin,
            role_id: user.role_id
        }
        return db.UserModel.create(payload);
    }

    static getById = (id: userParams) => {
        return db.UserModel.findByPk(id);
    }

    static getAll = () => {
        return db.UserModel.findAll();
    }

    static update = (id: number, data: userRequired) => {
        const payload = {
            name: data.name,
            email: data.email,
            ramal: data.ramal,
            setor_id: data.setor_id,
            firstLogin: data.firstLogin,
            role_id: data.role_id
        }
        return db.UserModel.update(payload, { where: { id } });
    }

    static delete = (id: number) => {
        return db.UserModel.destroy({ where: { id } });
    }

    static deleteBySetor = (setorId: number) => {
        return db.UserModel.destroy({ where: { setor_id: setorId } });
    }

    static alterarSenha = (id: number, password: string) => {
        return db.UserModel.update({ password }, { where: { id } });
    }
 }