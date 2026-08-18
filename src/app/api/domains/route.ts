import { NextResponse } from "next/server";
import { listDomains } from "@/lib/domains";

export async function GET() {
  try {
    const domains = listDomains();
    return NextResponse.json({ domains });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
