// app/api/send-whatsapp-otp/route.js
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { phoneNumber, otp } = await request.json();
    
    if (!phoneNumber || !otp) {
      return NextResponse.json({
        success: false,
        message: "Phone number and OTP are required",
      }, { status: 400 });
    }
    
    // Get Ngumzo API credentials from environment variables
    const apiKey = process.env.NGUMZO_API_KEY;
    const senderNumber = process.env.NGUMZO_SENDER_NUMBER;
    
    if (!apiKey || !senderNumber) {
      console.error("Missing Ngumzo API credentials in environment variables");
      return NextResponse.json({
        success: false,
        message: "Server configuration error",
      }, { status: 500 });
    }
    
    // Prepare the message
    const message = `Your identity verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`;
    
    // Make API call to Ngumzo WhatsApp API
    const response = await fetch("https://ngumzo.com/v1/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: senderNumber,
        recipient: phoneNumber,
        message: message,
      }),
    });
    
    const result = await response.json();
    
    if (result.status === true) {
      return NextResponse.json({
        success: true,
        message: "OTP sent successfully",
      });
    } else {
      console.error("Ngumzo API error:", result);
      return NextResponse.json({
        success: false,
        message: result.message || "Failed to send OTP via WhatsApp",
      });
    }
  } catch (error) {
    console.error("Error sending WhatsApp OTP:", error);
    return NextResponse.json({
      success: false,
      message: "Error processing request",
    }, { status: 500 });
  }
}