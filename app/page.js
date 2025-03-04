// app/page.jsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  Loader2,
  Phone,
  Eye,
  EyeOff
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
  const [showBackground, setShowBackground] = useState(true);
  
  // Form data
  const [idNumber, setIdNumber] = useState("");
  const [idData, setIdData] = useState(null);
  const [kraPin, setKraPin] = useState("");
  const [kraData, setKraData] = useState(null);
  const [email, setEmail] = useState("");
  const [atmCardFile, setAtmCardFile] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  
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
  
  // Send OTP via WhatsApp
  const sendOtp = async () => {
    if (!phoneNumber) {
      setError("Please enter your phone number");
      return;
    }
    
    // Validate phone number format
    const phoneRegex = /^\d{10,12}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\+/g, ''))) {
      setError("Please enter a valid phone number");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Generate random 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Format the phone number for WhatsApp API (ensure it has country code)
      let formattedNumber = phoneNumber;
      if (!formattedNumber.startsWith('+')) {
        formattedNumber = '+' + formattedNumber;
      }
      
      // Remove any leading plus sign for the API
      const apiPhoneNumber = formattedNumber.replace(/^\+/, '');
      
      // Call Ngumzo WhatsApp API to send OTP
      const response = await fetch("/api/send-whatsapp-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          phoneNumber: apiPhoneNumber,
          otp: generatedOtp 
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Store OTP in session for verification (in a real app, store this securely)
        sessionStorage.setItem('verificationOtp', generatedOtp);
        sessionStorage.setItem('otpTimestamp', Date.now().toString());
        
        setOtpSent(true);
        setSuccess("OTP sent to your WhatsApp number");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || "Failed to send OTP");
      }
    } catch (error) {
      setError("Error sending OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Verify OTP
  const verifyOtp = () => {
    if (!otpCode) {
      setError("Please enter the OTP sent to your WhatsApp");
      return;
    }
    
    const storedOtp = sessionStorage.getItem('verificationOtp');
    const otpTimestamp = parseInt(sessionStorage.getItem('otpTimestamp') || '0');
    
    // Check if OTP has expired (10 minutes)
    const isExpired = Date.now() - otpTimestamp > 10 * 60 * 1000;
    
    if (isExpired) {
      setError("OTP has expired. Please request a new one.");
      setOtpSent(false);
      return;
    }
    
    if (otpCode === storedOtp) {
      setOtpVerified(true);
      setSuccess("Phone number verified successfully");
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError("Invalid OTP. Please try again.");
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
    
    if (!otpVerified) {
      setError("Please verify your phone number with WhatsApp OTP");
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
      formData.append("phoneNumber", phoneNumber);
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
          phoneNumber,
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
  
  // Handle step navigation
  const goToNextStep = () => {
    const nextStep = step + 1;
    setStep(nextStep);
    setProgress(nextStep * 25 > 100 ? 100 : nextStep * 25);
    setError(null);
    setSuccess(null);
  };
  
  // Toggle background visibility
  const toggleBackground = () => {
    setShowBackground(!showBackground);
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
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative`}>
      {/* Background image with toggle */}
      <div className={`absolute inset-0 z-0 ${showBackground ? 'opacity-10' : 'opacity-0'} transition-opacity duration-300`} 
        style={{
          backgroundImage: `url('https://www.identifyafrica.io/map.svg')`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat'
        }}>
      </div>
      
      {/* Background toggle button */}
      <button 
        onClick={toggleBackground}
        className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white/100 rounded-full shadow-md text-[#2e1607] transition-all duration-200"
        aria-label="Toggle background"
      >
        {showBackground ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
      
      {/* Logo and header */}
      <div className="w-full max-w-md mb-6 flex flex-col items-center z-10">
        <div className="w-32 h-auto mb-2">
          <Image 
            src="https://www.identifyafrica.io/logo.png" 
            alt="Identify Africa Logo" 
            width={180} 
            height={60} 
            priority 
          />
        </div>
        <h1 className="text-2xl font-bold text-[#2e1607]">Identity Verification</h1>
      </div>
      
      {/* Main card */}
      <div className="w-full max-w-md z-10">
        <Card className="w-full shadow-lg border-none">
          <CardHeader className="bg-gradient-to-r from-[#e76c21] to-[#2e1607] text-white rounded-t-lg">
            <CardTitle className="text-xl text-center">
              Verification Portal
            </CardTitle>
            <Progress value={progress} className="h-2 mt-2 bg-white/20" indicatorColor="bg-white" />
          </CardHeader>
          
          <CardContent className="p-5">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardDescription className="mb-4 text-[#2e1607] font-medium">
                    Step 1: Liveness Detection
                  </CardDescription>
                  
                  <div className="space-y-4">
                    <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden shadow-inner">
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
                          <div className="w-32 h-32 border-2 border-dashed border-[#e76c21] rounded-full mb-4 animate-pulse" />
                          <div className="bg-[#2e1607]/80 text-white px-4 py-3 rounded-lg text-center max-w-xs mx-auto">
                            {livenessInstructions[livenessStage]}
                          </div>
                        </div>
                      )}
                      
                      {!livenessStarted && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center p-6 bg-white/90 rounded-lg shadow-sm max-w-xs">
                            <p className="mb-3 text-[#2e1607]">Camera access required for identity verification</p>
                            <Button 
                              onClick={startLivenessDetection}
                              className="bg-[#e76c21] hover:bg-[#e76c21]/90 text-white font-medium"
                            >
                              Start Liveness Check
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {livenessComplete && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#2e1607]/50">
                          <div className="bg-[#e76c21] text-white p-4 rounded-full shadow-lg">
                            <CheckCircle2 className="h-12 w-12" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {error && (
                      <Alert variant="destructive" className="border-red-300 bg-red-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <Button 
                      className="w-full bg-[#e76c21] hover:bg-[#e76c21]/90 text-white font-medium mt-2" 
                      disabled={!livenessComplete}
                      onClick={goToNextStep}
                    >
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: ID Verification */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardDescription className="mb-4 text-[#2e1607] font-medium">
                    Step 2: ID Verification
                  </CardDescription>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="id-number" className="text-[#2e1607] font-medium">ID Number</Label>
                      <Input
                        id="id-number"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        placeholder="Enter your ID number"
                        className="border-[#e76c21]/30 focus:border-[#e76c21] focus:ring-[#e76c21]/20 py-2"
                      />
                    </div>
                    
                    {error && (
                      <Alert variant="destructive" className="border-red-300 bg-red-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
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
                        className="space-y-3 border rounded-lg p-4 bg-[#e76c21]/5 border-[#e76c21]/20 shadow-sm"
                      >
                        <h3 className="text-sm font-medium text-[#2e1607]">Verified ID Information</h3>
                        <div className="grid grid-cols-1 gap-y-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-[#2e1607]/70">Full Name</Label>
                            <p className="font-medium text-[#2e1607] break-words bg-white/60 p-2 rounded shadow-sm min-h-8">
                              {idData.name}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs text-[#2e1607]/70">Gender</Label>
                              <p className="font-medium text-[#2e1607] break-words bg-white/60 p-2 rounded shadow-sm min-h-8">
                                {idData.gender}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-[#2e1607]/70">Citizenship</Label>
                              <p className="font-medium text-[#2e1607] break-words bg-white/60 p-2 rounded shadow-sm min-h-8">
                                {idData.citizenship}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-[#2e1607]/70">Date of Birth</Label>
                            <p className="font-medium text-[#2e1607] break-words bg-white/60 p-2 rounded shadow-sm min-h-8">
                              {idData.dob}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Button 
                        className="flex-1 bg-[#e76c21] hover:bg-[#e76c21]/90 text-white font-medium" 
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
                        className={`flex-1 ${idData ? 'bg-[#2e1607] hover:bg-[#2e1607]/90 text-white' : 'bg-slate-100 text-slate-400'}`}
                        onClick={goToNextStep}
                        disabled={!idData}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: KRA PIN Verification */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardDescription className="mb-4 text-[#2e1607] font-medium">
                    Step 3: KRA PIN Verification
                  </CardDescription>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="kra-pin" className="text-[#2e1607] font-medium">KRA PIN</Label>
                      <Input
                        id="kra-pin"
                        value={kraPin}
                        onChange={(e) => setKraPin(e.target.value)}
                        placeholder="Enter your KRA PIN (e.g., A123456789Z)"
                        className="border-[#e76c21]/30 focus:border-[#e76c21] focus:ring-[#e76c21]/20 py-2"
                      />
                    </div>
                    
                    {error && (
                      <Alert variant="destructive" className="border-red-300 bg-red-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
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
                        className="space-y-3 border rounded-lg p-4 bg-[#e76c21]/5 border-[#e76c21]/20 shadow-sm"
                      >
                        <h3 className="text-sm font-medium text-[#2e1607]">Verified KRA Information</h3>
                        <div className="grid grid-cols-1 gap-y-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-[#2e1607]/70">Taxpayer Name</Label>
                            <p className="font-medium text-[#2e1607] break-words bg-white/60 p-2 rounded shadow-sm min-h-8">
                              {kraData.TaxpayerName}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs text-[#2e1607]/70">PIN Number</Label>
                              <p className="font-medium text-[#2e1607] break-words bg-white/60 p-2 rounded shadow-sm min-h-8">
                                {kraData.PINNo}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-[#2e1607]/70">Station</Label>
                              <p className="font-medium text-[#2e1607] break-words bg-white/60 p-2 rounded shadow-sm min-h-8">
                                {kraData.Station}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-[#2e1607]/70">Email Address</Label>
                            <p className="font-medium text-[#2e1607] break-words bg-white/60 p-2 rounded shadow-sm min-h-8">
                              {kraData.Email_Addresses}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Button 
                        className="flex-1 bg-[#e76c21] hover:bg-[#e76c21]/90 text-white font-medium" 
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
                        className={`flex-1 ${kraData ? 'bg-[#2e1607] hover:bg-[#2e1607]/90 text-white' : 'bg-slate-100 text-slate-400'}`}
                        onClick={goToNextStep}
                        disabled={!kraData}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Upload ATM Card & Contact Information */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardDescription className="mb-4 text-[#2e1607] font-medium">
                    Step 4: Upload ATM Card & Contact Information
                  </CardDescription>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="atm-card" className="text-[#2e1607] font-medium">ATM Card Photo</Label>
                      <div className="border-2 border-dashed border-[#e76c21]/30 rounded-lg p-4 text-center hover:bg-[#e76c21]/5 transition-colors">
                        <input
                          id="atm-card"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <Label 
                          htmlFor="atm-card" 
                          className="cursor-pointer flex flex-col items-center justify-center gap-2 py-3"
                        >
                         {atmCardFile ? (
  <>
    <CheckCircle2 className="h-10 w-10 text-green-500" />
    <span className="text-sm text-[#2e1607] font-medium">
      {atmCardFile.name} ({(atmCardFile.size / 1024 / 1024).toFixed(2)} MB)
    </span>
  </>
) : (
  <>
    <svg className="h-10 w-10 text-[#e76c21]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
    <span className="text-sm text-[#2e1607] font-medium">
      Click to upload or drag and drop
    </span>
    <span className="text-xs text-[#2e1607]/70">
      JPG, PNG (max 5MB)
    </span>
  </>
)}
                        </Label>
                      </div>
                      <p className="text-xs text-[#2e1607]/70 italic mt-1">
                        For security, please cover the middle 8 digits and CVV of your card
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[#2e1607] font-medium">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email for confirmation"
                        className="border-[#e76c21]/30 focus:border-[#e76c21] focus:ring-[#e76c21]/20 py-2"
                      />
                    </div>
                    
                    {/* Phone Number Verification Section */}
                    <div className="space-y-3 border rounded-lg p-4 bg-[#2e1607]/5 border-[#2e1607]/10 shadow-sm">
                      <Label htmlFor="phone-number" className="text-[#2e1607] font-medium block">
                        Phone Number Verification
                      </Label>
                      
                      <div className="space-y-3">
                        {!otpVerified ? (
                          <>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Input
                                id="phone-number"
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="Enter phone number (e.g., 254712345678)"
                                disabled={otpSent}
                                className="flex-grow border-[#e76c21]/30 focus:border-[#e76c21] focus:ring-[#e76c21]/20 py-2"
                              />
                              <Button 
                                onClick={sendOtp}
                                disabled={loading || !phoneNumber || otpVerified}
                                className="bg-[#2e1607] hover:bg-[#2e1607]/80 text-white whitespace-nowrap"
                              >
                                {loading && !otpSent ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Phone className="mr-2 h-4 w-4" />
                                    Send OTP
                                  </>
                                )}
                              </Button>
                            </div>
                            
                            {otpSent && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="space-y-2"
                              >
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Input
                                    id="otp-code"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value)}
                                    placeholder="Enter 6-digit OTP sent to WhatsApp"
                                    className="flex-grow border-[#e76c21]/30 focus:border-[#e76c21] focus:ring-[#e76c21]/20 py-2"
                                    maxLength={6}
                                  />
                                  <Button 
                                    onClick={verifyOtp}
                                    disabled={loading || !otpCode}
                                    className="bg-[#2e1607] hover:bg-[#2e1607]/80 text-white whitespace-nowrap"
                                  >
                                    Verify OTP
                                  </Button>
                                </div>
                                <p className="text-xs text-[#2e1607]/70 italic">
                                  A verification code has been sent to your WhatsApp. Please enter the code to complete verification.
                                </p>
                              </motion.div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-medium">Phone number verified successfully</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {error && (
                      <Alert variant="destructive" className="border-red-300 bg-red-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    {success && (
                      <Alert className="bg-green-50 text-green-800 border-green-200">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>{success}</AlertDescription>
                      </Alert>
                    )}
                    
                    <Button 
                      className="w-full bg-[#e76c21] hover:bg-[#e76c21]/90 text-white font-medium mt-2" 
                      onClick={submitForm}
                      disabled={loading || !atmCardFile || !email || !otpVerified}
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

              {/* Step 5: Completion */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center py-6"
                >
                  <div className="mx-auto w-20 h-20 bg-[#e76c21]/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-12 w-12 text-[#e76c21]" />
                  </div>
                  
                  <CardTitle className="text-xl mb-3 text-[#2e1607]">Verification Complete</CardTitle>
                  <CardDescription className="mb-6 text-[#2e1607]/80 max-w-xs mx-auto">
                    Thank you for completing the verification process. A confirmation email
                    has been sent to your email address.
                  </CardDescription>
                  
                  <div className="bg-[#2e1607]/5 p-4 rounded-lg mb-6 max-w-xs mx-auto">
                    <p className="text-sm text-[#2e1607]/70 mb-1">Your reference number:</p>
                    <p className="font-mono font-medium text-[#2e1607] text-lg">
                      {localStorage.getItem("referenceNumber") || "IA-" + Math.random().toString(36).substring(2, 10).toUpperCase()}
                    </p>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button 
                      className="bg-[#e76c21] hover:bg-[#e76c21]/90 text-white font-medium"
                      onClick={() => window.location.href = 'https://www.identifyafrica.io'}
                    >
                      Return to Homepage
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
      
      {/* Footer */}
      <div className="mt-8 text-center text-[#2e1607]/70 text-sm z-10">
        <p>© {new Date().getFullYear()} Identify Africa. All rights reserved.</p>
      </div>
    </div>
  );
}