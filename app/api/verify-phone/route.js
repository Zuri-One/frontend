// app/api/verify-phone/route.js
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { phoneNumber } = await request.json();
    
    // Get credentials from environment variables
    const username = process.env.IDENTIFY_AFRICA_API_USERNAME;
    const password = process.env.IDENTIFY_AFRICA_API_PASSWORD;
    
    // Check if credentials are available
    if (!username || !password) {
      console.error("Missing API credentials in environment variables");
      return NextResponse.json({
        success: false,
        message: "Server configuration error",
      }, { status: 500 });
    }
    
    // Create Basic Auth header
    const basicAuth = "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
    
    // Format the phone number
    let formattedNumber = phoneNumber;
    if (formattedNumber.startsWith('+')) {
      formattedNumber = formattedNumber.substring(1);
    }
    if (formattedNumber.startsWith('254')) {
      formattedNumber = '0' + formattedNumber.substring(3);
    }
    
    // Make API call
    const response = await fetch("https://portal.identifyafrica.io/api/v1/phone", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": basicAuth,
      },
      body: JSON.stringify({ 
        account_number: formattedNumber,
        institution_code: "63902"
      }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        message: "Phone number verified successfully",
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message || "Phone number verification failed",
      });
    }
  } catch (error) {
    console.error("Error verifying phone:", error);
    return NextResponse.json({
      success: false,
      message: "Error processing request",
    }, { status: 500 });
  }
}