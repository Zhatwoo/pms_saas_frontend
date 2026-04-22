import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpeGJheWtjcm5qamxqYXRidWlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQ2NDEyOSwiZXhwIjoyMDkxMDQwMTI5fQ.741zoopVVPj7kRnc_FXWCHJcqWx1_VcArn9yMI4CjBo";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sixbaykcrnjjljatbuia.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const RESEND_API_KEY = "re_LDBVQzT7_52ym1AvV7Rg2GUNRpPnyhv5G"; 

    const { data: item } = await supabase
      .from("pawned_items")
      .select("id, item_name, items ( item_name ), customers ( full_name, email )")
      .eq("id", id)
      .single();

    if (!item) {
      return NextResponse.json({ success: false, message: "Item not found." }, { status: 404 });
    }

    let email = "";
    let fullName = "Customer";
    if (Array.isArray(item.customers) && item.customers.length > 0) {
      email = item.customers[0].email;
      fullName = item.customers[0].full_name;
    } else if (item.customers && !Array.isArray(item.customers)) {
      email = (item.customers as any).email;
      fullName = (item.customers as any).full_name;
    }

    if (!email) {
      return NextResponse.json({ success: false, message: "Customer has no email address." }, { status: 400 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Pawnshop <onboarding@resend.dev>",
        to: email, // Sending to ACTUAL email now
        subject: "Pawn Item Maturity Notice",
        html: `<p>Hello ${fullName},</p><p>This is a notice regarding your pawned item (Record ID: ${id}). Please visit the branch or respond to this email.</p>`,
      }),
    });
    
    const resData = await res.json();
    return NextResponse.json({ success: true, message: `Email sent to ${email} successfully.`, resendDetails: resData, status: res.status });
  } catch (error) {
    console.error("Send Email error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send email." },
      { status: 500 }
    );
  }
}

