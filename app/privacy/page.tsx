"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Globe
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: December 25, 2024</p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Overview
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Eat Around The Globe (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy.
              This policy explains how we collect, use, and protect your information
              when you use our service at eataroundtheglobe.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Information We Collect
            </h2>
            
            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
              Wallet Information
            </h3>
            <p className="text-gray-700 leading-relaxed">
              When you connect a cryptocurrency wallet (Ethereum, Solana, or Arweave),
              we access your public wallet address. This is necessary to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
              <li>Identify your recommendations on the blockchain</li>
              <li>Display your profile and activity</li>
              <li>Store your preferences permanently on Arweave</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
              Profile Information
            </h3>
            <p className="text-gray-700 leading-relaxed">
              If you create a profile, you may optionally provide:
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
              <li>A username (publicly displayed)</li>
              <li>A profile picture URL</li>
              <li>A bio</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              This information is stored permanently on the Arweave blockchain and
              is publicly accessible.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
              Recommendations &amp; Interactions
            </h3>
            <p className="text-gray-700 leading-relaxed">
              When you recommend a place, like a recommendation, or leave a comment,
              this data is stored permanently on the Arweave blockchain associated
              with your wallet address.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Analytics
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We use <a href="https://datafa.st" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">DataFast</a> for
              privacy-friendly analytics. DataFast is GDPR compliant and:
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
              <li>Does not use cookies</li>
              <li>Does not collect personal data</li>
              <li>Does not track you across websites</li>
              <li>Processes data in the EU</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              We collect anonymous usage data such as page views, button clicks,
              and feature usage to improve our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Blockchain Data
            </h2>
            <p className="text-gray-700 leading-relaxed">
              <strong>Important:</strong> Data stored on the Arweave blockchain is
              permanent and cannot be deleted. This includes your profile, recommendations,
              likes, and comments. Please consider this before submitting any information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Third-Party Services
            </h2>
            <p className="text-gray-700 leading-relaxed">We use the following third-party services:</p>
            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
              <li>
                <strong>Google Places API</strong> - For place search and details
              </li>
              <li>
                <strong>Mapbox</strong> - For the 3D globe visualization
              </li>
              <li>
                <strong>Arweave/Turbo</strong> - For permanent data storage
              </li>
              <li>
                <strong>WalletConnect</strong> - For wallet connections
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              Each service has its own privacy policy governing data they collect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Your Rights
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Under GDPR, you have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
              <li>Access the data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Object to processing of your data</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              Note: Due to the immutable nature of blockchain technology, data stored
              on Arweave cannot be modified or deleted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Contact Us
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this privacy policy or your data, please
              contact us at{" "}
              <a
                href="mailto:privacy@eataroundtheglobe.com"
                className="text-blue-600 hover:underline"
              >
                privacy@eataroundtheglobe.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Changes to This Policy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this privacy policy from time to time. We will notify
              you of any changes by posting the new policy on this page with an
              updated revision date.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            © {new Date().getFullYear()} Eat Around The Globe. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

