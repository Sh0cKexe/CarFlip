export const AI_ROZBOR_LIMIT = 50;
export const AI_INZERAT_LIMIT = 50;

export function zacatekMesice(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}
