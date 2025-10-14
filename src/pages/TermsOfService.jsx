import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using Resume Ranker ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                Resume Ranker is an AI-powered platform that:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Analyzes resumes and job descriptions using artificial intelligence</li>
                <li>Provides matching scores and insights for recruitment purposes</li>
                <li>Offers batch processing capabilities for multiple documents</li>
                <li>Integrates with Google Drive for document access</li>
                <li>Provides dashboard and analytics for users</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Registration</h2>
              <p className="text-gray-700 mb-4">
                To use our service, you must:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Be responsible for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
                <li>Be at least 18 years old or have parental consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use</h2>
              <p className="text-gray-700 mb-4">
                You agree to use the service only for lawful purposes and in accordance with these terms. You agree NOT to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Upload malicious software, viruses, or harmful code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>Interfere with or disrupt the service or servers</li>
                <li>Reverse engineer, decompile, or disassemble our software</li>
                <li>Use automated systems to access the service without permission</li>
                <li>Share your account credentials with others</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Content and Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                <strong>Your Content:</strong> You retain ownership of all content you upload to our service. By using our service, you grant us a limited license to process your content for the purpose of providing our services.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Our Content:</strong> The Resume Ranker service, including its design, functionality, and AI algorithms, is protected by intellectual property laws. You may not copy, modify, or distribute our proprietary technology.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Privacy and Data Protection</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these terms by reference. Key points:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>We process your documents only for analysis purposes</li>
                <li>Documents are not stored permanently after processing</li>
                <li>We use industry-standard security measures</li>
                <li>You can request deletion of your data at any time</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Service Availability and Modifications</h2>
              <p className="text-gray-700 mb-4">
                We strive to provide reliable service but cannot guarantee:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Uninterrupted service availability</li>
                <li>Error-free operation</li>
                <li>Compatibility with all systems</li>
              </ul>
              <p className="text-gray-700">
                We reserve the right to modify, suspend, or discontinue the service at any time with reasonable notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Billing and Payments</h2>
              <p className="text-gray-700 mb-4">
                <strong>Free Tier:</strong> Basic features are available at no cost with usage limits.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Paid Plans:</strong> Premium features require a subscription. All fees are non-refundable unless otherwise stated. We may change pricing with 30 days' notice.
              </p>
              <p className="text-gray-700">
                <strong>Payment Processing:</strong> Payments are processed securely through our payment partners. You are responsible for all applicable taxes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Disclaimers and Limitations</h2>
              <p className="text-gray-700 mb-4">
                <strong>Service Disclaimer:</strong> The service is provided "as is" without warranties of any kind. We do not guarantee the accuracy, completeness, or reliability of analysis results.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Limitation of Liability:</strong> To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Termination</h2>
              <p className="text-gray-700 mb-4">
                Either party may terminate this agreement at any time:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>You may delete your account at any time</li>
                <li>We may suspend or terminate accounts for violations of these terms</li>
                <li>Upon termination, your right to use the service ceases immediately</li>
                <li>We will delete your data according to our data retention policy</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Governing Law and Disputes</h2>
              <p className="text-gray-700 mb-4">
                These terms are governed by the laws of [Your Jurisdiction]. Any disputes will be resolved through binding arbitration or in the courts of [Your Jurisdiction].
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
              <p className="text-gray-700">
                We may update these terms from time to time. We will notify users of significant changes via email or through the service. Continued use of the service constitutes acceptance of the updated terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                For questions about these terms, please contact us:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> aaron.abhishay@finzarc.com<br />
                  <strong>Address:</strong> Resume Ranker Team<br />
                  <strong>Response Time:</strong> We respond to legal inquiries within 5 business days
                </p>
              </div>
            </section>
          </div>

          <div className="text-center mt-12">
            <Link to="/">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
