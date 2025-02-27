// app/api/verify-id/route.js
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { idNumber } = await request.json();
    
    // Basic Auth credentials
    const username = "api-a38c3b17ae";
    const password = "qLbDp4XkIEqHXIGNQ4FV53N4fnmVZyz29JY";
    
    // Create Basic Auth header
    const basicAuth = "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
    
    // Make API call
    const response = await fetch("https://portal.identifyafrica.io/api/v1/id", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": basicAuth,
      },
      body: JSON.stringify({ idnumber: idNumber }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        message: "ID verification successful",
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message || "ID verification failed",
      });
    }
  } catch (error) {
    console.error("Error verifying ID:", error);
    return NextResponse.json({
      success: false,
      message: "Error processing request",
    }, { status: 500 });
  }
}