import assert from 'node:assert/strict';
import test from 'node:test';
import { addMonths, businessDate, dateOnly, eligible, participationEnd, registrationWindow, validateHistory, validateConfiguration, Answers } from './edital-workflow.policy.js';

const answers: Answers = { desempregado: true, possui_renda: false, recebe_previdencia: false, inicio_residencia: '2024-10-22', vulnerabilidade_atestada: true, beneficiario_familiar: false, aceite: true };
const edital = { idade_maxima: 65, id: 'a', fase: 'aberto', vigencia_inicio: '2026-01-01', data_vencimento: '2027-12-31', inscricoes_inicio: '2026-10-01T09:00:00-03:00', inscricoes_fim: '2026-10-22T17:00:00-03:00', duracao_meses: 6, prorrogacao_meses: 3, permitir_participacao_anterior: false, permitir_retorno: false };
test('eligibility uses age boundaries and a full residence year', () => {
  eligible('2008-10-22', answers, '2026-10-22', edital);
  assert.throws(() => eligible('2008-10-23', answers, '2026-10-22', edital));
  eligible('1961-10-22', answers, '2026-10-22', edital);
  assert.throws(() => eligible('1960-10-22', answers, '2026-10-22', edital));
  eligible('1961-10-23', answers, '2026-10-22', edital);
  assert.throws(() => eligible('1990-01-01', { ...answers, inicio_residencia: '2025-10-23' }, '2026-10-22', edital));
  for (const denied of [{ desempregado: false }, { possui_renda: true }, { recebe_previdencia: true }, { aceite: false }, { vulnerabilidade_atestada: false }]) assert.throws(() => eligible('1990-01-01', { ...answers, ...denied }, '2026-10-22', edital));
  eligible('1990-01-01', { ...answers, beneficiario_familiar: true }, '2026-10-22', edital);
});
test('registration exact boundaries, encaixe and expired edital', () => {
  registrationWindow(edital, new Date(edital.inscricoes_inicio), false);
  registrationWindow(edital, new Date(edital.inscricoes_fim), false);
  assert.throws(() => registrationWindow(edital, new Date('2026-10-22T17:00:01-03:00'), false));
  assert.throws(() => registrationWindow(edital, new Date('2026-10-22T17:00:01-03:00'), true, ' '));
  registrationWindow(edital, new Date('2026-10-22T17:00:01-03:00'), true, 'Atendimento autorizado');
  assert.throws(() => registrationWindow(edital, new Date('2026-09-30T12:00:00-03:00'), true, 'Teste'));
  assert.throws(() => registrationWindow(edital, new Date('2028-01-01T00:00:00-03:00'), true, 'Teste'));
});
test('calendar months clamp days, duration never exceeds edital, invalid dates fail', () => {
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(addMonths('2024-01-31', 1), '2024-02-29');
  assert.equal(participationEnd(edital, '2027-10-22'), '2027-12-31');
  assert.throws(() => participationEnd(edital, '2028-01-01'));
  assert.throws(() => dateOnly('2026-02-30'));
  assert.equal(businessDate(new Date('2026-10-23T01:00:00Z')), '2026-10-22');
});
test('history considers activation, preserves cross-edital and same-month rules', () => {
  validateHistory(edital, [{ edital_id: 'b', status: 'cancelado', ativado_em: null }], '2026-10-22');
  assert.throws(() => validateHistory(edital, [{ edital_id: 'b', status: 'cancelado', ativado_em: '2026-01-01' }], '2026-10-22'));
  assert.throws(() => validateHistory({ ...edital, permitir_participacao_anterior: true }, [{ edital_id: 'b', status: 'convocado' }], '2026-10-22'));
  const past = [{ edital_id: 'a', status: 'concluido', ativado_em: '2026-01-01', concluded_at: '2026-09-30' }];
  assert.throws(() => validateHistory(edital, past, '2026-10-22'));
  validateHistory({ ...edital, permitir_retorno: true }, past, '2026-10-01');
  assert.throws(() => validateHistory({ ...edital, permitir_retorno: true }, past, '2026-09-30'));
});
test('configuration rejects inconsistent periods', () => {
  validateConfiguration(edital);
  assert.throws(() => validateConfiguration({ ...edital, inscricoes_fim: edital.inscricoes_inicio }));
  assert.throws(() => validateConfiguration({ ...edital, vigencia_inicio: '2028-01-01' }));
});

test('exception relaxes only the maximum age and historical participation', () => {
  eligible('1950-01-01', answers, '2026-10-22', edital, true);
  for (const value of [undefined, null, 17, 65.5]) {
    assert.throws(() => eligible('1950-01-01', answers, '2026-10-22', { idade_maxima: value }, true));
  }
  assert.throws(() => eligible('2008-10-23', answers, '2026-10-22', edital, true));
  assert.throws(() => eligible('1990-02-30', answers, '2026-10-22', edital, true));
  assert.throws(() => eligible(null, answers, '2026-10-22', edital, true));
  assert.throws(() => eligible('1950-01-01', { ...answers, aceite: false }, '2026-10-22', edital, true));
  const histories = [
    [{ edital_id: 'b', status: 'concluido', ativado_em: '2026-10-01' }],
    [{ edital_id: 'a', status: 'concluido', ativado_em: '2026-10-01', concluded_at: '2026-10-21' }],
  ];
  for (const history of histories) {
    assert.throws(() => validateHistory(edital, history, '2026-10-22'));
    validateHistory(edital, history, '2026-10-22', true);
  }
  for (const status of ['convocado', 'ativo']) assert.throws(() => validateHistory(edital, [{ status }], '2026-10-22', true));
  eligible('2008-02-29', answers, '2026-03-01', edital);
  assert.throws(() => eligible('2008-02-29', answers, '2026-02-28', edital));
});
