import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpeGJheWtjcm5qamxqYXRidWlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQ2NDEyOSwiZXhwIjoyMDkxMDQwMTI5fQ.741zoopVVPj7kRnc_FXWCHJcqWx1_VcArn9yMI4CjBo";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sixbaykcrnjjljatbuia.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const bucket = body?.bucket || "items";
    const itemIds = body?.itemIds || [];

    if (!itemIds.length) {
      return NextResponse.json({ success: false, message: "No items to send to." }, { status: 400 });
    }

    // Fetch the emails from Supabase
    const { data: pawnedItems } = await supabase
      .from("pawned_items")
      .select("id, item_name, items ( item_name ), customers ( full_name, email )")
      .in("id", itemIds);

    const RESEND_API_KEY = "re_LDBVQzT7_52ym1AvV7Rg2GUNRpPnyhv5G"; 
    const results: any[] = [];

    if (pawnedItems && pawnedItems.length > 0) {
      await Promise.all(
        pawnedItems.map(async (item) => {
          let email = "";
          let fullName = "Customer";
          if (Array.isArray(item.customers) && item.customers.length > 0) {
            email = item.customers[0].email;
            fullName = item.customers[0].full_name;
          } else if (item.customers && !Array.isArray(item.customers)) {
            email = (item.customers as any).email;
            fullName = (item.customers as any).full_name;
          }

          if (email) {
            try {
              const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${RESEND_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: "Pawnshop <onboarding@resend.dev>",
                  to: email, // Sending to ACTUAL email now
                  subject: `Pawnshop Notice: Expiring Item in ${bucket}`,
                  html: `<p>Hello ${fullName},</p><p>This is an automated notice regarding your pawned item (<strong>${item.item_name || (item.items as any)?.item_name || 'N/A'}</strong>). Please visit the branch or respond to this email.</p>`,
                }),
              });
              const resData = await res.json();
              results.push({ email, status: res.status, response: resData });
            } catch (err) {
              results.push({ email, error: String(err) });
            }
          } else {
            results.push({ id: item.id, error: "No email" });
          }
        })
      );
    }

    return NextResponse.json({ success: true, message: "Email blast process finished.", results });
  } catch (error) {
    console.error("Email Blast error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to queue blast." },
      { status: 500 }
    );
  }
}

