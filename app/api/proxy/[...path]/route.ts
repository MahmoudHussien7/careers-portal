/**
 * Catch-all proxy route for backend API calls
 * Forwards all /api/proxy/* requests to the backend
 * This avoids CORS issues since the request comes from the server
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
}

async function proxyRequest(
  request: NextRequest,
  method: string,
): Promise<NextResponse> {
  try {
    // Extract the path and query string after /api/proxy/
    const url = new URL(request.url);
    const backendPath = url.pathname.replace("/api/proxy", "");
    const queryString = url.search;

    const targetUrl = `${BACKEND_URL}${backendPath}${queryString}`;

    // Get the request body if it exists
    let body: ArrayBuffer | string | undefined = undefined;
    if (method !== "GET" && method !== "HEAD") {
      try {
        const contentType = request.headers.get("content-type");
        if (contentType?.includes("multipart/form-data")) {
          body = await request.arrayBuffer();
        } else {
          body = await request.text();
        }
      } catch (e) {
        body = undefined;
      }
    }

    // Forward headers (exclude host and connection headers)
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey !== "host" &&
        lowerKey !== "connection" &&
        lowerKey !== "content-length"
      ) {
        headers[key] = value;
      }
    });

    // Make the request to the backend
    const backendResponse = await fetch(targetUrl, {
      method,
      headers,
      body: body || undefined,
    });

    // Get response body
    const responseBody = await backendResponse.text();

    // Create response with same status and headers
    const response = new NextResponse(responseBody, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
    });

    // Copy relevant headers from backend response
    backendResponse.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      // Skip certain headers that should not be copied
      if (
        lowerKey !== "content-encoding" &&
        lowerKey !== "transfer-encoding" &&
        lowerKey !== "connection"
      ) {
        response.headers.set(key, value);
      }
    });

    return response;
  } catch (error: any) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      {
        error: "Proxy request failed",
        message: error.message,
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, "GET");
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, "POST");
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request, "PUT");
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request, "DELETE");
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request, "PATCH");
}
