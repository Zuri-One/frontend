// app/api/submit/route.js
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";

export async function POST(request) {
  try {
    // Get form data
    const formData = await request.formData();
    const email = formData.get("email");
    const atmCard = formData.get("atmCard");
    const idData = JSON.parse(formData.get("idData"));
    const kraData = JSON.parse(formData.get("kraData"));
    
    // Generate a reference number
    const referenceNumber = "IA-" + uuidv4().substring(0, 8).toUpperCase();
    
    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: {
        user: "resend",
        pass: "re_i3vqCRXN_EouPiYK5hrLHnuBeRgGr3L2R",
      },
    });
    
    // Email content
    const mailOptions = {
      from: "Identify Africa <info@mailer.identifyafrica.io>",
      to: email,
      subject: "Identity Verification Confirmation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #0066cc;">Identity Verification Confirmation</h1>
          </div>
          
          <p>Dear ${idData.name},</p>
          
          <p>Thank you for completing the identity verification process. Your verification has been received and is being processed.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Reference Number:</strong> ${referenceNumber}</p>
          </div>
          
          <p>Here's a summary of your verification details:</p>
          
          <ul>
            <li><strong>Name:</strong> ${idData.name}</li>
            <li><strong>ID Number:</strong> ${idData.id_number}</li>
            <li><strong>KRA PIN:</strong> ${kraData.PINNo}</li>
            <li><strong>Email:</strong> ${email}</li>
          </ul>
          
          <p>If you have any questions or need further assistance, please don't hesitate to contact our support team.</p>
          
          <p>Best regards,<br>The Identify Africa Team</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; text-align: center; color: #666; font-size: 12px;">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `,
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    
// app/api/submit/route.js (continued)
    // Return success response
    return NextResponse.json({
        success: true,
        message: "Verification submitted successfully",
        referenceNumber,
      });
      
    } catch (error) {
      console.error("Error submitting verification:", error);
      return NextResponse.json({
        success: false,
        message: "Error processing submission",
      }, { status: 500 });
    }
  }