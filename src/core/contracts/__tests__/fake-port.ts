/** Unimplemented domain operations fail loudly; no ORM API is reproduced. */
export function fakePort<Port extends object>(
  implemented: Partial<Port>,
): Port {
  return new Proxy(implemented, {
    get(target, key) {
      if (key in target) return Reflect.get(target, key);
      return () => {
        throw new Error("Unexpected port operation: " + String(key));
      };
    },
  }) as Port;
}
