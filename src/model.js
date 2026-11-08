export function safeURL(value) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password
      ? u.href
      : undefined;
  } catch {
    return undefined;
  }
}
export function normalizeC2ICard(card) {
  if (!card || card.schemaVersion !== 1 || !Array.isArray(card.settings))
    throw new TypeError("Expected a C2I schemaVersion 1 card");
  return {
    ...card,
    settings: card.settings
      .filter(
        (f) =>
          !f.isSensitive &&
          !f.hidden &&
          !f.immutable &&
          !/password|secret|token|credential|api.?key|private.?key/i.test(
            f.name,
          ),
      )
      .map((f) => ({ ...f, value: String(f.value ?? "") })),
  };
}
export const sameSettings = (a, b) =>
  JSON.stringify(Object.entries(a).sort()) ===
  JSON.stringify(Object.entries(b).sort());
export const settingsValues = (fields) =>
  Object.fromEntries(fields.map((f) => [f.name, String(f.value ?? "")]));
export function validateFields(fields, values) {
  const errors = {};
  for (const f of fields) {
    const value = values[f.name] ?? "";
    if (f.required && !value.trim()) errors[f.name] = "Enter a value.";
    else if (
      value !== "" &&
      f.format === "number" &&
      !Number.isFinite(Number(value))
    )
      errors[f.name] = "Enter a finite number.";
    else if (
      value !== "" &&
      f.format === "number" &&
      f.min !== undefined &&
      Number(value) < f.min
    )
      errors[f.name] = `Minimum: ${f.min}.`;
    else if (
      value !== "" &&
      f.format === "number" &&
      f.max !== undefined &&
      Number(value) > f.max
    )
      errors[f.name] = `Maximum: ${f.max}.`;
    else if (f.options?.length && !f.options.some((o) => o.value === value))
      errors[f.name] = "Choose a listed option.";
  }
  return errors;
}
