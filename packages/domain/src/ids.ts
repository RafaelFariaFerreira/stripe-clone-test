/**
 * Shortens a Stripe object id for narrow table cells while keeping both ends
 * recognisable: `pi_3UdA4wL2cI6mqjNa0fxt9wsQ` → `pi_3UdA…9wsQ`.
 * The full id is always what gets copied.
 */
export function shortenId(id: string, head = 4, tail = 4): string {
  const separator = id.indexOf('_');
  const prefix = separator >= 0 ? id.slice(0, separator + 1) : '';
  const body = id.slice(prefix.length);
  if (body.length <= head + tail + 1) return id;
  return `${prefix}${body.slice(0, head)}…${body.slice(-tail)}`;
}
