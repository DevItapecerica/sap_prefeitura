import CryptData from "../../../../core/shared/utils/CryptData.js";
import Carterinha from "../entity/Carteirinha.js";

export default class CarterinhaCriptografy {
    constructor(private carterinha: Carterinha, private criptografy: CryptData) {
        this.criptografy = new CryptData();
    }

    public cript(): Carterinha {
        return this.carterinha;
    }

    public descript(): Carterinha {
        return this.carterinha;
    }
}