import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FtRelatorioCsvFormatter } from '../formatter/ft-relatorio-csv.formatter.js';
import { FtEdital } from '../../../ft-edital/domain/entity/FtEdital.js';
import type { FtRelatorioPagamento, FtRelatorioBolsistaRow } from '../../domain/services/ft-relatorio-pagamento.service.js';

const formatter = new FtRelatorioCsvFormatter();
const row: FtRelatorioBolsistaRow = {
  bco: '001', ag: '0012', dig_ag: 'X', conta: '000123', dig_conta: '0',
  nome: 'Maria da Silva', cpf: '012.345.678-90', local: 'Local que não deve ser exportado',
  vencimento: '2029-12-31', dias_uteis: 22, faltas: 1, valor_bruto: 900,
  desconto: 0, valor_liquido: 900,
};
const report = (rows: FtRelatorioBolsistaRow[] = [row], start = '2026-09-01', day = 10): FtRelatorioPagamento => ({
  edital: new FtEdital('Edital não exportado', '2026-01-01', '2029-12-31', day, 900),
  periodo: { data_inicio: start, data_fim: '2029-12-31' }, dias_uteis: 22,
  locais: [{ pagador: 'Pagador não exportado', rows, total_bolsistas: rows.length, total_valor: 900 }],
  total_bolsistas: rows.length, total_valor: 900,
});

test('pagamento exporta somente os nove campos, sem alterar zeros bancários ou dígitos alfabéticos', () => {
  const csv = formatter.format(report());
  assert.equal(csv, '001;0012;X;000123;0;Maria da Silva;90000;10092026;01234567890');
  assert.equal(csv.split(';').length, 9);
});

for (const [amount, cents] of [[900, '90000'], [900.01, '90001'], [299.99, '29999'], [1.01, '101'], [0.29, '29'], [0.01, '1'], [0, '0']] as const) {
  test(`exporta ${amount} como ${cents} centavos inteiros`, () => {
    assert.equal(formatter.format(report([{ ...row, valor_liquido: amount }])).split(';')[6], cents);
  });
}

for (const [start, day, expected] of [
  ['2026-09-01', 10, '10092026'], ['2026-04-15', 31, '30042026'],
  ['2026-02-01', 31, '28022026'], ['2028-02-01', 31, '29022028'],
  ['2026-01-01', 1, '01012026'], ['2026-12-01', 31, '31122026'],
] as const) {
  test(`data usa o mês inicial ${start} e dia ${day}, resultando em ${expected}`, () => {
    assert.equal(formatter.format(report([row], start, day)).split(';')[7], expected);
  });
}

test('achata múltiplos pagadores sem consolidar ou repetir cabeçalhos e totais', () => {
  const data = report();
  data.locais.push({ ...data.locais[0]!, pagador: 'Outro pagador', rows: [{ ...row, valor_liquido: 0.01 }] });
  assert.equal(formatter.format(data), [
    '001;0012;X;000123;0;Maria da Silva;90000;10092026;01234567890',
    '001;0012;X;000123;0;Maria da Silva;1;10092026;01234567890',
  ].join('\n'));
});

test('sem pagamentos retorna arquivo vazio, inclusive para coleções sem grupos', () => {
  assert.equal(formatter.format(report([])), '');
  const data = report();
  data.locais = [];
  assert.equal(formatter.format(data), '');
});

test('escapa delimitadores, aspas e quebras de linha sem mudar o conteúdo do nome', () => {
  assert.equal(formatter.format(report([{ ...row, nome: 'Maria; "Silva"\r\nSouza' }])),
    '001;0012;X;000123;0;"Maria; ""Silva""\r\nSouza";90000;10092026;01234567890');
});
