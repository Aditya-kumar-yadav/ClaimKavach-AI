import { NextRequest, NextResponse } from "next/server";
import { ExtractedClaimSchema } from "@/types/claim";
import { evaluateClaim } from "@/lib/rule-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Accept either direct claim object or { claim, policy } wrapper
    const claimData = body && body.claim ? body.claim : body;
    const parsedClaim = ExtractedClaimSchema.parse(claimData);

    const auditResult = evaluateClaim(parsedClaim);
    return NextResponse.json(auditResult);
  } catch (error: any) {
    console.error("API /api/validate Error:", error);
    return NextResponse.json(
      { error: "Validation failure", details: error.message },
      { status: 400 }
    );
  }
}
