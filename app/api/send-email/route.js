// app/api/send-email/route.js
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const { email, subject, message } = await request.json();
    
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
      subject: subject,
      html: message.replace(/\n/g, "<br>"),
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    });
    
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({
      success: false,
      message: "Error sending email",
    }, { status: 500 });
  }
}