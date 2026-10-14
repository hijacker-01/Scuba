export function indiaDateTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Enter a valid India date and time');
  const date = new Date(`${value}:00+05:30`);
  if (!Number.isFinite(date.getTime()) || toIndiaInput(date) !== value) throw new Error('Enter a valid India date and time');
  return date.toISOString();
}
export function toIndiaInput(value: Date | string) { return new Date(new Date(value).getTime() + 330 * 60_000).toISOString().slice(0, 16); }
