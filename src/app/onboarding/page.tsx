import { ProfileForm } from "@/components/profile/profile-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set Up Your Profile | Internship Radar",
  description:
    "Create a student profile to find relevant internships, research programs, hackathons, and scholarships."
};

export default function OnboardingPage() {
  return <ProfileForm mode="onboarding" />;
}
