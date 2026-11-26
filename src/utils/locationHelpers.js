export function normalizeGstStateCode(code) {
  if (code == null || code === '') return null;
  return String(code).padStart(2, '0');
}

export function findStateNameByRegionCode(states, regionCode, codeKey = 'gstStateCode') {
  if (!Array.isArray(states) || regionCode == null) return null;
  const padded = normalizeGstStateCode(regionCode);
  const found = states.find(s => String(s[codeKey] ?? '').padStart(2, '0') === padded);
  return found?.name ?? null;
}

export function findStateName(states, name) {
  const wanted = String(name || '')
    .trim()
    .toLowerCase();
  if (!Array.isArray(states) || !wanted) return null;
  return (
    states.find(
      s =>
        String(s.name || '')
          .trim()
          .toLowerCase() === wanted
    )?.name ?? null
  );
}
