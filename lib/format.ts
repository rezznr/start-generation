export const nowMs = () => Date.now();

const TZ = "Asia/Jakarta";

export const idr = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const date = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", year: "numeric" });
const time = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });

export const wibDate = (iso: string) => date.format(new Date(iso));
export const wibTime = (iso: string) => time.format(new Date(iso));
export const wibRange = (a: string, b: string) => `${wibDate(a)}, ${wibTime(a)} to ${wibTime(b)} WIB`;
export const wibDateTime = (iso: string) => `${wibDate(iso)}, ${wibTime(iso)} WIB`;

// Jakarta has no DST, so +07:00 is exact. Parsing never depends on the browser or server timezone.
export const fromWibInput = (v: string) => new Date(`${v}:00+07:00`).toISOString();
export const toWibInput = (iso: string) =>
  new Date(new Date(iso).getTime() + 7 * 3600_000).toISOString().slice(0, 16);

/** YYYY-MM-DD of an instant as seen in Jakarta. */
export const wibDay = (iso: string | number | Date) =>
  new Date(new Date(iso).getTime() + 7 * 3600_000).toISOString().slice(0, 10);

export const duration = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}` : `${m}m`);
