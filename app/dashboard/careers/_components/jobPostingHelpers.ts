export function jobStatusAccent(statusName?: string | null): string {
  const name = statusName?.toLowerCase() ?? "";
  if (
    name.includes("publish") ||
    name.includes("active") ||
    name.includes("open")
  ) {
    return "bg-gi-primary";
  }
  if (name.includes("draft")) return "bg-gi-secondary";
  if (name.includes("arch") || name.includes("close")) {
    return "bg-muted-foreground/50";
  }
  return "bg-gi-primary/50";
}

export function jobStatusBadgeClasses(statusName?: string | null): string {
  const name = statusName?.toLowerCase() ?? "";
  if (
    name.includes("publish") ||
    name.includes("active") ||
    name.includes("open")
  ) {
    return "border border-gi-primary/20 bg-gi-primary/10 text-gi-primary";
  }
  if (name.includes("draft")) {
    return "border border-border-color bg-muted-background text-muted-foreground";
  }
  if (name.includes("arch") || name.includes("close")) {
    return "border border-border-color bg-muted-background text-muted-foreground";
  }
  return "border border-gi-secondary/30 bg-gi-secondary/10 text-gi-secondary";
}
