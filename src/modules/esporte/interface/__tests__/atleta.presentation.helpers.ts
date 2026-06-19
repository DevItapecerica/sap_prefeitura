import Atleta from "../../domain/entity/Atleta.js";
import Municipe from "../../../municipe/domain/entity/Municipe.js";

export function makeAtleta() {
  const createdAt = new Date("2026-06-02T00:00:00.000Z");
  const updatedAt = new Date("2026-06-03T00:00:00.000Z");
  const municipe = new Municipe(
    "Maria Silva",
    "12345678900",
    "2000-05-10",
    "(11) 99999-9999",
    "Rua Completa",
    "Bairro Completo",
    "Itapecerica da Serra",
    "SP",
    "06850000",
    "123",
    "Casa 2",
    7,
    "mun-1",
    createdAt,
    updatedAt,
  );

  return new Atleta(
    "mun-1",
    true,
    7,
    "atl-1",
    createdAt,
    updatedAt,
    null,
    municipe,
  );
}
