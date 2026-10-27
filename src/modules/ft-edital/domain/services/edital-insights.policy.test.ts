import assert from 'node:assert/strict';
import test from 'node:test';
import { participationSignals, extensionEnd, paymentIssues } from './edital-insights.policy.js';
const edital = { fase: 'aberto', data_vencimento: '2028-12-31', prorrogacao_meses: 3 };
test('civil dates use Brasilia, inclusive 30-day warnings and 7-day reservations', () => {
  const now = new Date('2026-11-01T01:00:00Z'); // still October 31 in Brasilia
  const signal = (end: string) => participationSignals(edital, { status: 'ativo', expire_at: end }, now);
  assert.equal(signal('2026-11-30').dias_restantes, 30);
  assert.equal(signal('2026-11-30').vencimento_alerta, 'proximo');
  assert.equal(signal('2026-12-01').vencimento_alerta, null);
  assert.equal(signal('2026-10-30').vencimento_alerta, 'vencido');
  assert.equal(signal('2026-10-31').dias_restantes, 0);
  for (const [date, days, warning] of [['2026-10-25T02:00:00Z', 7, true], ['2026-10-25T15:00:00Z', 6, false]] as const) {
    const result = participationSignals(edital, { status: 'convocado', createdAt: date, updatedAt: now, data_vinculo: '2026-12-01' }, now);
    assert.equal(result.dias_reservada, days);
    assert.equal(result.reserva_antiga, warning);
  }
});
test('exact extension handles leap month and edital cap; explains unavailable actions', () => {
  const row = { status: 'ativo', expire_at: '2028-01-31', prorrogated: false };
  assert.equal(extensionEnd({ ...edital, prorrogacao_meses: 1 }, row, new Date('2028-01-20T15:00:00Z')), '2028-02-29');
  assert.equal(extensionEnd({ ...edital, data_vencimento: '2028-02-15' }, row, new Date('2028-01-20T15:00:00Z')), '2028-02-15');
  for (const patch of [{ status: 'convocado' }, { prorrogated: true }, { expire_at: '2027-12-31' }, { expire_at: '2028-12-31' }]) assert.throws(() => extensionEnd(edital, { ...row, ...patch }, new Date('2028-01-20T15:00:00Z')));
  assert.throws(() => extensionEnd({ ...edital, prorrogacao_meses: 0 }, row, new Date('2028-01-20T15:00:00Z')));
});
test('bank warnings preserve accepted zeros and alphabetic digits', () => {
  assert.deepEqual(paymentIssues({ bco: '001', ag: '0012', dig_ag: 'X', conta: '0001', dig_conta: 'x' }), []);
  assert.equal(paymentIssues(null).length, 5);
  assert.equal(paymentIssues({ bco: '1234' })[0]?.campo, 'payment_info.bco');
});
