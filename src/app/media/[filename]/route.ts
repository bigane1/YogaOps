export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { readUploadFile } from "@/lib/serve-upload-file";

type RouteParams = { params: Promise<{ filename: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { filename } = await params;
  const file = await readUploadFile(filename);
  if (!file) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
