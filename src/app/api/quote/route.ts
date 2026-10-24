import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateReference } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      email,
      serviceId,
      description,
      address,
      preferredDate,
      preferredTime,
      preferredContact,
    } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { message: "Le nom et le numéro de téléphone sont requis." },
        { status: 400 }
      );
    }

    const referenceNumber = generateReference("DEV-QT");

    try {
      const supabase = createAdminClient();
      await supabase.from("leads").insert({
        reference_number: referenceNumber,
        full_name: name,
        phone,
        email: email || null,
        message: description || "",
        address: address || "Tataouine",
        preferred_date: preferredDate || null,
        preferred_time: preferredTime || null,
        preferred_contact: preferredContact || "phone",
        source: "website_quote_form",
        status: "new",
      });
    } catch (dbErr) {
      console.warn("Supabase lead insertion skipped or unconfigured:", dbErr);
    }

    return NextResponse.json({
      success: true,
      referenceNumber,
      message: "Demande de devis enregistrée avec succès.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Erreur lors du traitement.", error: error?.message },
      { status: 500 }
    );
  }
}
