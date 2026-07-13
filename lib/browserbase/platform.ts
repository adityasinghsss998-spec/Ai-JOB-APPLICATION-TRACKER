/**
 * Helper to detect the job application platform based on URL and database field
 */
export function detectJobPlatform(url: string, platformFromDb?: string): string {
  const lowercaseUrl = url.toLowerCase();

  if (lowercaseUrl.includes("greenhouse.io")) {
    return "Greenhouse";
  }
  if (lowercaseUrl.includes("lever.co")) {
    return "Lever";
  }
  if (lowercaseUrl.includes("workable.com")) {
    return "Workable";
  }

  // Fallback check on database field
  if (platformFromDb) {
    const lowerPlatform = platformFromDb.toLowerCase();
    if (lowerPlatform === "greenhouse") return "Greenhouse";
    if (lowerPlatform === "lever") return "Lever";
    if (lowerPlatform === "workable") return "Workable";
  }

  return "Other";
}
