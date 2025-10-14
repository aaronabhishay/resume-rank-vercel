import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { FileText, Users, Zap, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Resume Ranker
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The intelligent resume analysis platform that helps recruiters and job seekers 
            find the perfect match using advanced AI technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/analysis">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Start Analyzing Resumes
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>AI-Powered Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Advanced machine learning algorithms analyze resumes and job descriptions 
                to provide accurate matching scores and insights.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Batch Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Process multiple resumes simultaneously with our efficient batch processing 
                system that saves time and reduces costs.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Zap className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <CardTitle>Lightning Fast</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get results in seconds with our optimized processing pipeline 
                powered by Google's Gemini AI technology.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Secure & Private</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Your data is protected with enterprise-grade security. 
                We never store your documents permanently.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Trusted by Recruiters Worldwide
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of HR professionals who rely on Resume Ranker 
            to streamline their hiring process.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                Access Dashboard
              </Button>
            </Link>
            <Link to="/saved-jobs">
              <Button size="lg" variant="outline">
                View Saved Jobs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
