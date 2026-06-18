export function analyzeGroup(description?: string) {
  const desc = (description || "").toLowerCase();
  return {
    allowAds: !desc.includes("запрещена реклама"),
    hasModeration: desc.includes("админ") || desc.includes("правил"),
    risky: desc.includes("бан") || desc.includes("блок")
  };
}