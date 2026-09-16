export function formFieldString(form: FormData, name: string): string {
  const value = form.get(name);
  if (typeof value === "string") return value;
  return "";
}
