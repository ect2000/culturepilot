import "server-only";
const requests = new Map<string, { count: number; until: number }>();
let active = 0;
export function admit(ip: string): (() => void) | null {
  const now = Date.now();
  for (const [key, value] of requests)
    if (value.until < now) requests.delete(key);
  const old = requests.get(ip);
  if (active >= 8 || (old && old.count >= 5) || requests.size >= 2000)
    return null;
  requests.set(ip, {
    count: (old?.count ?? 0) + 1,
    until: old?.until ?? now + 600000,
  });
  active++;
  let released = false;
  return () => {
    if (!released) {
      active--;
      released = true;
    }
  };
}
