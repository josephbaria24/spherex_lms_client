// app/api/bunny/upload/route.ts
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    // Detailed environment variable check
    const storageZone = process.env.BUNNY_STORAGE_ZONE
    const storagePassword = process.env.BUNNY_STORAGE_PASSWORD

    console.log("Environment check:", {
      hasStorageZone: !!storageZone,
      hasStoragePassword: !!storagePassword,
      storageZone: storageZone,
      // Don't log the actual password, just check format
      passwordFormat: storagePassword?.substring(0, 8) + "...",
      passwordLength: storagePassword?.length
    })

    if (!storageZone || !storagePassword) {
      console.error("Missing Bunny environment variables")
      return NextResponse.json(
        { 
          error: "Server configuration error",
          details: {
            hasStorageZone: !!storageZone,
            hasStoragePassword: !!storagePassword
          }
        },
        { status: 500 }
      )
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const path = formData.get("path") as string

    if (!file || !path) {
      return NextResponse.json({ error: "Missing file or path" }, { status: 400 })
    }

    console.log("Upload details:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      path: path,
      storageZone: storageZone,
    })

    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Ensure path doesn't start with /
    const cleanPath = path.startsWith('/') ? path.substring(1) : path
    
    // Use region from environment variable (sg for Singapore)
    const region = process.env.BUNNY_STORAGE_REGION || 'sg'
    const uploadUrl = `https://${region}.storage.bunnycdn.com/${storageZone}/${cleanPath}`

    console.log("Final upload URL:", uploadUrl)

    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "AccessKey": storagePassword,
        "Content-Type": "application/octet-stream",
        "Content-Length": buffer.length.toString(),
      },
      body: buffer,
    })

    console.log("Bunny response:", {
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries())
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("Bunny upload failed:", {
        status: res.status,
        statusText: res.statusText,
        error: errorText
      })
      
      return NextResponse.json(
        {
          error: "Upload failed",
          details: errorText,
          status: res.status,
          url: uploadUrl, // Include URL for debugging (remove in production)
        },
        { status: 500 }
      )
    }

    const responseText = await res.text()
    console.log("Upload successful!", responseText)

    return NextResponse.json({ 
      success: true, 
      path: cleanPath,
      message: responseText 
    })
  } catch (error) {
    console.error("Upload route error:", error)
    return NextResponse.json(
      { 
        error: "Server error", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}