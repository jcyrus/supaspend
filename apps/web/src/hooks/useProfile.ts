import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth-utils";
import type { User } from "@/types/database";

interface ProfileData {
  display_name: string;
  username: string;
  avatar_url: string;
}

interface UserData {
  profile: User;
  email: string;
}

export function useProfile() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const currentUser = await getCurrentUser();
      if (currentUser?.profile) {
        setUser({
          profile: currentUser.profile,
          email: currentUser.email || "",
        });
      } else {
        setError("No user profile found");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to fetch profile");
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData: ProfileData): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4444"}/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(profileData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Profile update failed:", data);
        let errorMessage = data.error || "Failed to update profile";

        // Handle specific RLS error
        if (data.statusCode === "403" || response.status === 403) {
          errorMessage =
            "Permission denied. Please check your database RLS policies.";
        }

        throw new Error(errorMessage);
      }

      // Update local user state
      setUser((prev) =>
        prev
          ? {
              ...prev,
              profile: data.profile,
            }
          : null
      );

      return true;
    } catch (err) {
      console.error("Error updating profile:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update profile";
      setError(errorMessage);
      return false;
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file");
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
      }

      // Create a unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.profile.id}/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
      return null;
    }
  };

  const updatePassword = async (newPassword: string): Promise<boolean> => {
    try {
      if (newPassword.length < 8) {
        throw new Error("New password must be at least 8 characters long");
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      return true;
    } catch (err) {
      console.error("Error updating password:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update password"
      );
      return false;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    user,
    isLoading,
    error,
    updateProfile,
    uploadAvatar,
    updatePassword,
    refetch: fetchProfile,
  };
}
