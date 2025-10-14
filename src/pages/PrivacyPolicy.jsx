import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
              <p className="text-gray-700 mb-4">
                Resume Ranker collects the following types of information:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Resume Documents:</strong> PDF, DOC, DOCX files uploaded for analysis</li>
                <li><strong>Job Descriptions:</strong> Text descriptions provided for matching</li>
                <li><strong>Google Drive Access:</strong> Read-only access to folders you authorize</li>
                <li><strong>Account Information:</strong> Email address and basic profile data</li>
                <li><strong>Usage Data:</strong> Analysis results, processing times, and feature usage</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">
                We use your information to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Analyze resumes and provide matching scores</li>
                <li>Generate insights and recommendations</li>
                <li>Improve our AI algorithms and services</li>
                <li>Provide customer support and technical assistance</li>
                <li>Send important service updates and notifications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Data Storage and Security</h2>
              <p className="text-gray-700 mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Encryption:</strong> All data is encrypted in transit and at rest</li>
                <li><strong>Access Control:</strong> Strict access controls and authentication</li>
                <li><strong>Secure Infrastructure:</strong> Hosted on secure cloud platforms</li>
                <li><strong>Regular Audits:</strong> Regular security assessments and updates</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your data for the following periods:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Resume Documents:</strong> Deleted immediately after analysis (not stored permanently)</li>
                <li><strong>Analysis Results:</strong> Stored for 30 days for your access, then automatically deleted</li>
                <li><strong>Account Data:</strong> Retained while your account is active</li>
                <li><strong>Usage Analytics:</strong> Aggregated and anonymized data may be retained longer</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Third-Party Services</h2>
              <p className="text-gray-700 mb-4">
                We use the following third-party services:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Google AI (Gemini):</strong> For resume analysis and AI processing</li>
                <li><strong>Google Drive API:</strong> For accessing your authorized folders</li>
                <li><strong>Supabase:</strong> For secure data storage and authentication</li>
                <li><strong>Vercel:</strong> For hosting and content delivery</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
              <p className="text-gray-700 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and data</li>
                <li>Export your data</li>
                <li>Opt out of marketing communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">
                We use essential cookies for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Authentication and session management</li>
                <li>Remembering your preferences</li>
                <li>Improving website performance</li>
              </ul>
              <p className="text-gray-700">
                We do not use tracking cookies or third-party analytics without your consent.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Children's Privacy</h2>
              <p className="text-gray-700">
                Our service is not intended for children under 13. We do not knowingly collect 
                personal information from children under 13. If you believe we have collected 
                such information, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this privacy policy from time to time. We will notify you of any 
                significant changes by email or through our service. Your continued use of the 
                service constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this privacy policy or our data practices, 
                please contact us:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> aaron.abhishay@finzarc.com<br />
                  <strong>Address:</strong> Resume Ranker Team<br />
                  <strong>Response Time:</strong> We respond to privacy inquiries within 48 hours
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
