// Drops undefined fields so they don't overwrite values when spread.
export const definedOnly = <T extends object>(obj: T): Partial<T> =>
	Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
