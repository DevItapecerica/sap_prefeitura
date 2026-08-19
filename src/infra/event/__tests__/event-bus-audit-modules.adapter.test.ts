import assert from "node:assert/strict";
import test from "node:test";
import { ApplicationEventContext } from "../../../core/event/application-event.js";
import {
  makeAuthEventPublisher,
  makeAuthEventSubscriber,
} from "../../../modules/auth/factories/auth-events.factory.js";
import {
  makeMunicipeEventPublisher,
  makeMunicipeEventSubscriber,
} from "../../../modules/municipe/factories/municipe-events.factory.js";
import {
  makeEsporteEventPublisher,
  makeEsporteEventSubscriber,
} from "../../../modules/esporte/factories/esporte-events.factory.js";
import {
  makeFtEditalEventPublisher,
  makeFtEditalEventSubscriber,
} from "../../../modules/ft-edital/factories/ft-edital-events.factory.js";
import {
  makeFtBolsistaEventPublisher,
  makeFtBolsistaEventSubscriber,
} from "../../../modules/ft-bolsista/factories/ft-bolsista-events.factory.js";
import { AUTH_EVENTS } from "../../../modules/auth/application/events/auth.events.js";
import { MUNICIPE_EVENTS } from "../../../modules/municipe/application/events/municipe.events.js";
import { ESPORTE_EVENTS } from "../../../modules/esporte/application/events/esporte.events.js";
import { FT_EDITAL_EVENTS } from "../../../modules/ft-edital/application/events/ft-edital.events.js";
import { FT_BOLSISTA_EVENTS } from "../../../modules/ft-bolsista/application/events/ft-bolsista.events.js";

const context: ApplicationEventContext = {
  correlationId: "request-1",
  origin: { type: "SYSTEM" },
};

test("adapter genérico publica mapas tipados e remove subscriptions", async () => {
  let authCalls = 0;
  const unsubscribeAuth = makeAuthEventSubscriber().subscribe(
    AUTH_EVENTS.loginSucceeded,
    () => {
      authCalls++;
    },
  );
  await makeAuthEventPublisher().publish(AUTH_EVENTS.loginSucceeded, { context });
  unsubscribeAuth();
  await makeAuthEventPublisher().publish(AUTH_EVENTS.loginSucceeded, { context });
  assert.equal(authCalls, 1);

  let municipeCalls = 0;
  const unsubscribeMunicipe = makeMunicipeEventSubscriber().subscribe(
    MUNICIPE_EVENTS.created,
    () => {
      municipeCalls++;
    },
  );
  await makeMunicipeEventPublisher().publish(MUNICIPE_EVENTS.created, {
    context,
    after: { uuid: "m1" } as any,
  });
  unsubscribeMunicipe();
  await makeMunicipeEventPublisher().publish(MUNICIPE_EVENTS.created, {
    context,
    after: { uuid: "m1" } as any,
  });
  assert.equal(municipeCalls, 1);

  let esporteCalls = 0;
  const unsubscribeEsporte = makeEsporteEventSubscriber().subscribe(
    ESPORTE_EVENTS.atletaCreated,
    () => {
      esporteCalls++;
    },
  );
  await makeEsporteEventPublisher().publish(ESPORTE_EVENTS.atletaCreated, {
    context,
    resourceType: "atleta",
    after: { uuid: "a1" },
  });
  unsubscribeEsporte();
  await makeEsporteEventPublisher().publish(ESPORTE_EVENTS.atletaCreated, {
    context,
    resourceType: "atleta",
    after: { uuid: "a1" },
  });
  assert.equal(esporteCalls, 1);

  let editalCalls = 0;
  const unsubscribeEdital = makeFtEditalEventSubscriber().subscribe(
    FT_EDITAL_EVENTS.updated,
    () => {
      editalCalls++;
    },
  );
  await makeFtEditalEventPublisher().publish(FT_EDITAL_EVENTS.updated, {
    context,
    before: { id: "e1" },
    after: { id: "e1" },
  });
  unsubscribeEdital();
  await makeFtEditalEventPublisher().publish(FT_EDITAL_EVENTS.updated, {
    context,
    before: { id: "e1" },
    after: { id: "e1" },
  });
  assert.equal(editalCalls, 1);

  let bolsistaCalls = 0;
  const unsubscribeBolsista = makeFtBolsistaEventSubscriber().subscribe(
    FT_BOLSISTA_EVENTS.deleted,
    () => {
      bolsistaCalls++;
    },
  );
  await makeFtBolsistaEventPublisher().publish(FT_BOLSISTA_EVENTS.deleted, {
    context,
    resourceType: "falta",
    resourceId: "f1",
    before: { id: "f1" },
  });
  unsubscribeBolsista();
  await makeFtBolsistaEventPublisher().publish(FT_BOLSISTA_EVENTS.deleted, {
    context,
    resourceType: "falta",
    resourceId: "f1",
    before: { id: "f1" },
  });
  assert.equal(bolsistaCalls, 1);
});
