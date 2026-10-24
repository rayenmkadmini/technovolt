import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateReference } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, service, message, preferredContact } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { message: "Le nom et le numéro de téléphone sont obligatoires." },
        { status: 400 }
      );
    }

    const referenceNumber = generateReference("DEV-CT");

    try {
      const supabase = createAdminClient();
      await supabase.from("leads").insert({
        reference_number: referenceNumber,
        full_name: name,
        phone,
        email: email || null,
        message: message || "",
        source: "website_contact",
        preferred_contact: preferredContact || "phone",
        status: "new",
      });
    } catch (dbErr) {
      console.warn("Supabase lead insertion skipped or not yet linked:", dbErr);
    }

    return NextResponse.json({
      success: true,
      referenceNumber,
      message: "Demande de contact reçue avec succès.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Erreur de traitement.", error: error?.message },
      { status: 500 }
    );
  }
}
