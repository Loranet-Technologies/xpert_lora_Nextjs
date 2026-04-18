"use client";

export {
  USER_GUIDE_SECTIONS,
  UserGuideContent,
  type UserGuideVariant,
} from "./UserGuideContent";

import { UserGuideContent } from "./UserGuideContent";

/** Shorter home-page section; full walkthrough with screenshot slots is at `/user-guide`. */
export function LandingUserGuide() {
  return <UserGuideContent variant="embedded" />;
}
