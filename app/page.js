// app/page.jsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  AlertCircle,
  Loader2 
} from "lucide-react";
import { 
  motion, 
  AnimatePresence 
} from "framer-motion";

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [progress, setProgress] = useState(25);
  
  // Form data
  const [idNumber, setIdNumber] = useState("");
  const [idData, setIdData] = useState(null);
  const [kraPin, setKraPin] = useState("");
  const [kraData, setKraData] = useState(null);
  const [email, setEmail] = useState("");
  const [atmCardFile, setAtmCardFile] = useState(null);
  
  // Liveness detection
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [livenessStarted, setLivenessStarted] = useState(false);
  const [livenessStage, setLivenessStage] = useState(0);
  const [livenessComplete, setLivenessComplete] = useState(false);
  const [stream, setStream] = useState(null);
  
  const livenessInstructions = [
    "Please look straight at the camera",
    "Please blink three times",
    "Please turn your head slightly to the left",
    "Please turn your head slightly to the right",
    "Please smile"
  ];
  
  // Start liveness detection
  const startLivenessDetection = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setLivenessStarted(true);
      
      // Simulate liveness detection steps
      let currentStage = 0;
      const livenessInterval = setInterval(() => {
        currentStage++;
        setLivenessStage(currentStage);
        
        if (currentStage >= livenessInstructions.length) {
          clearInterval(livenessInterval);
          setLivenessComplete(true);
          
          // Take a screenshot as proof
          const canvas = canvasRef.current;
          const video = videoRef.current;
          const context = canvas.getContext('2d');
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Store the verification image in localStorage
          const imageData = canvas.toDataURL('image/png');
          localStorage.setItem('livenessImage', imageData);
          
          // Stop the camera stream
          setTimeout(() => {
            if (stream) {
              stream.getTracks().forEach(track => track.stop());
            }
          }, 1000);
        }
      }, 3000);
      
    } catch (error) {
      setError("Camera access denied. Please enable camera permissions and try again.");
    }
  };
  
  // Verify ID number
  const verifyId = async () => {
    if (!idNumber) {
      setError("Please enter your ID number");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/verify-id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idNumber }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIdData(result.data);
        setSuccess("ID verified successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || "ID verification failed");
      }
    } catch (error) {
      setError("Error verifying ID. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Verify KRA PIN
  const verifyKraPin = async () => {
    if (!kraPin) {
      setError("Please enter your KRA PIN");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/verify-kra", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ kraPin }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setKraData(result.data);
        setSuccess("KRA PIN verified successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || "KRA PIN verification failed");
      }
    } catch (error) {
      setError("Error verifying KRA PIN. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Submit final form
  const submitForm = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    
    if (!atmCardFile) {
      setError("Please upload a photo of your ATM card");
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append("email", email);
      formData.append("atmCard", atmCardFile);
      formData.append("idData", JSON.stringify(idData));
      formData.append("kraData", JSON.stringify(kraData));
      
      const response = await fetch("/api/submit", {
        method: "POST",
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Save verification data to localStorage
        const verificationData = {
          idData,
          kraData,
          email,
          referenceNumber: result.referenceNumber,
          completedAt: new Date().toISOString(),
        };
        
        localStorage.setItem("verificationData", JSON.stringify(verificationData));
        
        // Set reference number for display
        localStorage.setItem("referenceNumber", result.referenceNumber);
        
        // Go to completion step
        setStep(5);
        setProgress(100);
      } else {
        setError(result.message || "Submission failed");
      }
    } catch (error) {
      setError("Error submitting form. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle step navigation
  const goToNextStep = () => {
    const nextStep = step + 1;
    setStep(nextStep);
    setProgress(nextStep * 25 > 100 ? 100 : nextStep * 25);
    setError(null);
    setSuccess(null);
  };
  
  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit");
        return;
      }
      
      // Validate file type
      if (!file.type.match('image.*')) {
        setError("Please upload an image file");
        return;
      }
      
      setAtmCardFile(file);
    }
  };
  
  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-center text-primary">
              Identity Verification
            </CardTitle>
            <Progress value={progress} className="h-2 mt-2" />
          </CardHeader>
          
          <CardContent>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardDescription className="mb-4">
                    Step 1: Liveness Detection
                  </CardDescription>
                  
                  <div className="space-y-4">
                    <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden">
                      <video 
                        ref={videoRef}
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover"
                      />
                      <canvas 
                        ref={canvasRef} 
                        className="hidden" 
                      />
                      
                      {livenessStarted && !livenessComplete && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="w-32 h-32 border-2 border-dashed border-white rounded-full mb-4" />
                          <div className="bg-black/50 text-white px-3 py-2 rounded text-center">
                            {livenessInstructions[livenessStage]}
                          </div>
                        </div>
                      )}
                      
                      {!livenessStarted && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center p-4">
                            <p className="mb-2">Camera access required</p>
                            <Button onClick={startLivenessDetection}>
                              Start Liveness Check
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {livenessComplete && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <div className="bg-green-500 text-white p-3 rounded-full">
                            <CheckCircle2 className="h-10 w-10" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <Button 
                      className="w-full" 
                      disabled={!livenessComplete}
                      onClick={goToNextStep}
                    >
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}
              
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardDescription className="mb-4">
                    Step 2: ID Verification
                  </CardDescription>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="id-number">ID Number</Label>
                      <Input
                        id="id-number"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        placeholder="Enter your ID number"
                      />
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
                    
                    {idData && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-2 border rounded-lg p-3 bg-slate-50"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-slate-500">Name</Label>
                            <p className="font-medium">{idData.name}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500">Gender</Label>
                            <p className="font-medium">{idData.gender}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500">Date of Birth</Label>
                            <p className="font-medium">{idData.dob}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500">Citizenship</Label>
                            <p className="font-medium">{idData.citizenship}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button 
                        className="flex-1" 
                        onClick={verifyId}
                        disabled={loading || !idNumber}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Verify ID"
                        )}
                      </Button>
                      
                      <Button 
                        className="flex-1" 
                        onClick={goToNextStep}
                        disabled={!idData}
                        variant={idData ? "default" : "outline"}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardDescription className="mb-4">
                    Step 3: KRA PIN Verification
                  </CardDescription>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="kra-pin">KRA PIN</Label>
                      <Input
                        id="kra-pin"
                        value={kraPin}
                        onChange={(e) => setKraPin(e.target.value)}
                        placeholder="Enter your KRA PIN (e.g., A123456789Z)"
                      />
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
                    
                    {kraData && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-2 border rounded-lg p-3 bg-slate-50"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-slate-500">Taxpayer Name</Label>
                            <p className="font-medium">{kraData.TaxpayerName}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500">PIN Number</Label>
                            <p className="font-medium">{kraData.PINNo}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500">Email Address</Label>
                            <p className="font-medium">{kraData.Email_Addresses}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500">Station</Label>
                            <p className="font-medium">{kraData.Station}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button 
                        className="flex-1" 
                        onClick={verifyKraPin}
                        disabled={loading || !kraPin}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Verify KRA PIN"
                        )}
                      </Button>
                      
                      <Button 
                        className="flex-1" 
                        onClick={goToNextStep}
                        disabled={!kraData}
                        variant={kraData ? "default" : "outline"}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardDescription className="mb-4">
                    Step 4: Upload ATM Card & Contact Information
                  </CardDescription>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="atm-card">ATM Card Photo</Label>
                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:bg-slate-50 transition-colors">
                        <input
                          id="atm-card"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <Label 
                          htmlFor="atm-card" 
                          className="cursor-pointer flex flex-col items-center justify-center gap-1"
                        >
                          {atmCardFile ? (
                            <>
                              <CheckCircle2 className="h-8 w-8 text-green-500" />
                              <span className="text-sm text-slate-700">
                                {atmCardFile.name} ({(atmCardFile.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </>
                          ) : (
                            <>
                              <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <span className="text-sm text-slate-700">
                                Click to upload or drag and drop
                              </span>
                              <span className="text-xs text-slate-500">
                                JPG, PNG (max 5MB)
                              </span>
                            </>
                          )}
                        </Label>
                      </div>
                      <p className="text-xs text-slate-500">
                        For security, please cover the middle 8 digits and CVV of your card
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email for confirmation"
                      />
                    </div>
                    
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <Button 
                      className="w-full" 
                      onClick={submitForm}
                      disabled={loading || !atmCardFile || !email}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Complete Verification"
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
              
              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center py-6"
                >
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  
                  <CardTitle className="text-xl mb-2">Verification Complete</CardTitle>
                  <CardDescription className="mb-4">
                    Thank you for completing the verification process. A confirmation email
                    has been sent to your email address.
                  </CardDescription>
                  
                  <div className="bg-slate-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-slate-500 mb-1">Your reference number:</p>
                    <p className="font-mono font-medium">
                      {localStorage.getItem("referenceNumber") || "IA-" + Math.random().toString(36).substring(2, 10).toUpperCase()}
                    </p>
                  </div>
                  
                  <p className="text-sm text-slate-500">
                    You may close this window now.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}