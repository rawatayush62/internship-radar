import { ProfileForm } from "@/components/profile/profile-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Profile | Internship Radar",
  description:
    "Manage your study details, skills, opportunity preferences, and saved profile data."
};

export default function ProfilePage() {
  return <ProfileForm mode="edit" />;
}
