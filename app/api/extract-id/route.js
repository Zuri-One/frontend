// app/api/extract-id/route.js
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // Get form data from request
    const formData = await request.formData();
    const image = formData.get("image");
    
    if (!image) {
      return NextResponse.json({
        success: false,
        message: "No image file provided",
      }, { status: 400 });
    }
    
    // Get credentials from environment variables
    const apiKey = process.env.IDENTIFY_AFRICA_EXTRACT_API_KEY;
    
    // Check if credentials are available
    if (!apiKey) {
      console.error("Missing API key in environment variables");
      return NextResponse.json({
        success: false,
        message: "Server configuration error",
      }, { status: 500 });
    }
    
    // Convert file to Buffer
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create a new form data for the API request
    const apiFormData = new FormData();
    
    // Append the buffer directly with filename information
    // This avoids the need to create a File object which isn't available in Node.js
    apiFormData.append("image", new Blob([buffer], { type: image.type }), image.name);
    
    // Make API call to document extraction service
    const response = await fetch("https://document.identifyafrica.com/extract-id", {
      method: "POST",
      headers: {
        "x-api-key": apiKey
      },
      body: apiFormData,
    });
    
    const result = await response.json();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        verification: result.verification,
        message: "Document extraction successful",
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message || "Document extraction failed",
      });
    }
  } catch (error) {
    console.error("Error extracting document:", error);
    return NextResponse.json({
      success: false,
      message: "Error processing request",
    }, { status: 500 });
  }
}