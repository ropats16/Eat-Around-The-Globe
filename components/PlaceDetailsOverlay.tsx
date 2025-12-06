"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MapPin,
  Star,
  Phone,
  Globe as GlobeIcon,
  Clock,
  Plus,
  User,
  MessageSquare,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Recommender } from "@/lib/types";

interface PlaceDetailsOverlayProps {
  place: google.maps.places.PlaceResult | null;
  onClose: () => void;
  onSaveToMap: (recommender: Recommender) => void;
  isSaving?: boolean;
}

export default function PlaceDetailsOverlay({
  place,
  onClose,
  onSaveToMap,
  isSaving = false,
}: PlaceDetailsOverlayProps) {
  const [showForm, setShowForm] = useState(false);
  const [recommenderName, setRecommenderName] = useState("");
  const [recommenderPfp, setRecommenderPfp] = useState("");
  const [recommenderCaption, setRecommenderCaption] = useState("");

  if (!place) return null;

  const photos = place.photos?.slice(0, 3) || [];
  const priceLevel = place.price_level ? "$".repeat(place.price_level) : null;

  const handleSubmit = () => {
    if (!recommenderName.trim()) {
      alert("Please enter your name");
      return;
    }

    const recommender: Recommender = {
      name: recommenderName.trim(),
      profilePicture: recommenderPfp.trim() || undefined,
      caption: recommenderCaption.trim() || undefined,
    };

    onSaveToMap(recommender);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-3xl shadow-[0_2px_12px_rgba(32,33,36,0.28)] overflow-hidden"
      >
        {/* Header with Photos */}
        {photos.length > 0 && (
          <div className="relative h-48 bg-gray-200">
            <div className="grid grid-cols-3 gap-1 h-full">
              {photos.map((photo, index) => (
                <div key={index} className="relative w-full h-full">
                  <Image
                    src={photo.getUrl({ maxWidth: 400 })}
                    alt={`${place.name} photo ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          {/* Title and Rating */}
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              {place.name}
            </h2>
            <div className="flex items-center gap-2 text-sm">
              {place.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{place.rating}</span>
                  {place.user_ratings_total && (
                    <span className="text-gray-500">
                      ({place.user_ratings_total.toLocaleString()})
                    </span>
                  )}
                </div>
              )}
              {priceLevel && (
                <span className="text-gray-600">• {priceLevel}</span>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="space-y-3 mb-5">
            {place.formatted_address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">
                  {place.formatted_address}
                </span>
              </div>
            )}

            {place.international_phone_number && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700">
                  {place.international_phone_number}
                </span>
              </div>
            )}

            {place.website && (
              <div className="flex items-center gap-3">
                <GlobeIcon className="w-5 h-5 text-gray-400 shrink-0" />
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline truncate"
                >
                  {new URL(place.website).hostname}
                </a>
              </div>
            )}

            {place.opening_hours?.weekday_text && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <details className="cursor-pointer">
                    <summary className="hover:text-gray-900">
                      {place.opening_hours.open_now ? "Open now" : "Closed"}
                    </summary>
                    <ul className="mt-2 space-y-1 text-xs text-gray-600">
                      {place.opening_hours.weekday_text.map((day, index) => (
                        <li key={index}>{day}</li>
                      ))}
                    </ul>
                  </details>
                </div>
              </div>
            )}
          </div>

          {/* Action Button / Form */}
          {!showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              disabled={isSaving}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full py-6 font-medium shadow-lg hover:shadow-xl transition-all"
            >
              <span className="flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                Add to My Map
              </span>
            </Button>
          ) : (
            <div className="space-y-4 p-4 bg-gray-50 rounded-2xl">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                Your Recommendation
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <Input
                    placeholder="Enter your name"
                    value={recommenderName}
                    onChange={(e) => setRecommenderName(e.target.value)}
                    className="bg-white"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                    <ImageIcon className="w-4 h-4" />
                    Profile Picture URL (optional)
                  </label>
                  <Input
                    placeholder="https://example.com/your-photo.jpg"
                    value={recommenderPfp}
                    onChange={(e) => setRecommenderPfp(e.target.value)}
                    className="bg-white"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                    <MessageSquare className="w-4 h-4" />
                    Caption (optional)
                  </label>
                  <Textarea
                    placeholder="Why do you recommend this place?"
                    value={recommenderCaption}
                    onChange={(e) => setRecommenderCaption(e.target.value)}
                    className="bg-white resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowForm(false)}
                  variant="outline"
                  className="flex-1 rounded-full"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSaving || !recommenderName.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-full"
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Save to Map"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Google Maps Link */}
          {place.url && (
            <a
              href={place.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-sm text-blue-600 hover:underline mt-3"
            >
              View on Google Maps
            </a>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
