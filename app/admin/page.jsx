// app/admin/page.jsx
"use client";

import { useState } from "react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, CheckCircle2, AlertCircle, Send } from "lucide-react";

export default function AdminPage() {
  const [generatedLink, setGeneratedLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailContent, setEmailContent] = useState(
    "Dear customer,\n\nPlease complete your identity verification by clicking on the link below:\n\n[VERIFICATION_LINK]\n\nThis link will expire in 72 hours.\n\nRegards,\nIdentify Africa Team"
  );
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Generate verification link
  const generateLink = () => {
    // Create a unique token
    const token = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
    
    // Get the current hostname
    const hostname = window.location.origin;
    
    // Create the verification link
    const link = `${hostname}?token=${token}`;
    
    setGeneratedLink(link);
    setLinkCopied(false);
  };
  
  // Copy link to clipboard
  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setLinkCopied(true);
    
    setTimeout(() => {
      setLinkCopied(false);
    }, 3000);
  };
  
  // Send verification email
  const sendVerificationEmail = async () => {
    if (!generatedLink) {
      setError("Please generate a verification link first");
      return;
    }
    
    if (!recipientEmail) {
      setError("Please enter a recipient email");
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      setError("Please enter a valid email address");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Replace placeholder with actual link
      const emailBody = emailContent.replace("[VERIFICATION_LINK]", generatedLink);
      
      // Send email via API
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: recipientEmail,
          subject: "Identity Verification Request",
          message: emailBody,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess("Verification email sent successfully");
        
        // Reset form after successful send
        setRecipientEmail("");
        setGeneratedLink("");
        
        setTimeout(() => {
          setSuccess(null);
        }, 5000);
      } else {
        setError(result.message || "Failed to send email");
      }
    } catch (error) {
      setError("Error sending email. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Verification Link</CardTitle>
              <CardDescription>
                Create a unique verification link to send to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={generateLink} 
                  className="w-full"
                >
                  Generate New Link
                </Button>
                
                {generatedLink && (
                  <div className="space-y-2">
                    <Label>Verification Link</Label>
                    <div className="flex">
                      <Input 
                        value={generatedLink} 
                        readOnly 
                        className="rounded-r-none"
                      />
                      <Button 
                        onClick={copyLink} 
                        variant={linkCopied ? "outline" : "default"}
                        className="rounded-l-none"
                      >
                        {linkCopied ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Send Verification Email</CardTitle>
              <CardDescription>
                Send the verification link to a user via email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient-email">Recipient Email</Label>
                  <Input
                    id="recipient-email"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email-content">Email Content</Label>
                  <Textarea
                    id="email-content"
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    rows={6}
                  />
                  <p className="text-xs text-slate-500">
                    Use [VERIFICATION_LINK] as a placeholder for the verification link.
                  </p>
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {success && (
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={sendVerificationEmail}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Send className="mr-2 h-4 w-4" />
                    Send Verification Email
                  </span>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}