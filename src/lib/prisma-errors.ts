export function isMissingTableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("does not exist") ||
    message.includes("P2021") ||
    message.includes("MemberDocument") ||
    message.includes("MedicalReport")
  );
}
