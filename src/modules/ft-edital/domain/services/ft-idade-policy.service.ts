import { ftError } from "../../../ft-bolsista/application/utils/ft-error.js";
import { dateOnly, requireAgeLimit } from './edital-workflow.policy.js';

const dateParts = (value: string | Date) => {
  const text = value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
};

export const calcularIdadeNaData = (nascimento: string | Date, referencia: string | Date) => {
  const birth = dateParts(nascimento);
  const ref = dateParts(referencia);
  if (!birth || !ref) throw ftError(422, "Data de nascimento invalida");
  dateOnly(nascimento);
  dateOnly(referencia);
  let idade = ref.year - birth.year;
  if (ref.month < birth.month || (ref.month === birth.month && ref.day < birth.day)) idade -= 1;
  return idade;
};

export const ensureBolsistaElegivelPorIdade = (bolsista: any, referencia: string | Date, edital: any) => {
  const config = edital?.toJSON?.() ?? edital;
  requireAgeLimit(config);
  const municipe = bolsista?.get?.("municipe") ?? bolsista?.municipe;
  const nascimento = municipe?.get?.("nascimento") ?? municipe?.nascimento;
  if (!nascimento) throw ftError(422, "Atualize a data de nascimento do municipe antes de vincular");
  const age = calcularIdadeNaData(nascimento, referencia);
  if (age < 18 || age > config.idade_maxima) {
    throw ftError(403, `Idade permitida: 18 a ${config.idade_maxima} anos`);
  }
};
