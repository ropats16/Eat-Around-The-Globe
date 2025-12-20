"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useFoodGlobeStore } from "@/lib/store";
import { X, Loader2, User, ImageIcon } from "lucide-react";
import { useState } from "react";
import { uploadProfile } from "@/lib/arweave";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";

export default function ProfileSetupModal() {
  const {
    isProfileModalOpen,
    closeProfileModal,
    walletType,
    walletAddress,
    walletProvider,
    setUserProfile,
  } = useFoodGlobeStore();

  const [username, setUsername] = useState("");
  const [pfp, setPfp] = useState("");
  const [bio, setBio] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !walletType || !walletAddress) {
      return;
    }

    setIsUploading(true);

    try {
      console.log("📝 Creating user profile...");

      const profileData = {
        username: username.trim(),
        pfp: pfp.trim() || undefined,
        bio: bio.trim() || undefined,
      };

      console.log("📝 [PROFILE SAVE] Saving profile:", {
        profileData,
        walletType,
        walletAddress,
      });

      // Upload to Arweave
      const result = await uploadProfile(profileData, {
        walletType,
        walletAddress,
        provider: walletProvider,
      });

      console.log("✅ [PROFILE SAVE] Profile saved to Arweave:", {
        txId: result.id,
        walletAddress,
        walletType,
      });

      // Cache in store
      setUserProfile(profileData);

      // Close modal
      closeProfileModal();
    } catch (error) {
      console.error("❌ Failed to create profile:", error);
      alert("Failed to create profile. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isProfileModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeProfileModal}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div className="bg-white rounded-3xl shadow-2xl shadow-black/15 border border-gray-100 overflow-hidden w-full max-w-[420px] pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Create Your Profile
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Set up your Eat Around The Globe identity
                  </p>
                </div>
                <button
                  onClick={closeProfileModal}
                  disabled={isUploading}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:scale-110 disabled:opacity-50 shadow-md shadow-black/5"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Form */}
              <div className="px-6 pb-6 pt-4 space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <InputGroup className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <InputGroupAddon>
                      <User className="w-4 h-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder="Your display name"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="text-sm"
                      disabled={isUploading}
                    />
                  </InputGroup>
                </div>

                {/* Profile Picture */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Picture URL (optional)
                  </label>
                  <InputGroup className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <InputGroupAddon>
                      <ImageIcon className="w-4 h-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder="https://example.com/avatar.jpg"
                      value={pfp}
                      onChange={(e) => setPfp(e.target.value)}
                      className="text-sm"
                      disabled={isUploading}
                    />
                  </InputGroup>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio (optional)
                  </label>
                  <Textarea
                    placeholder="Tell us about your food journey..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="bg-white resize-none text-sm"
                    rows={3}
                    disabled={isUploading}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isUploading || !username.trim()}
                  className="w-full bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl py-6 font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isUploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Profile...
                    </span>
                  ) : (
                    "Create Profile"
                  )}
                </Button>

                {/* Footer note */}
                <p className="text-xs text-gray-400 text-center leading-relaxed">
                  Your profile will be stored permanently on Arweave and linked
                  to your wallet address.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
