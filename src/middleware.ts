import { jwtVerify } from "jose"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey)

async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    })
    return payload
  } catch {
    return null
  }
}

// Routes that don't require authentication
const publicRoutes = ["/login"]

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isPublicRoute = publicRoutes.includes(path)
  const isApiRoute = path.startsWith("/api")

  // Get session from cookie
  const cookie = (await cookies()).get("session")?.value
  const session = await decrypt(cookie)

  // Handle unauthenticated users
  if (!isPublicRoute && !session?.userId) {
    // Return 401 for API routes
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    // Redirect to /login for page routes
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  // Redirect to / if the user is authenticated and trying to access login
  if (isPublicRoute && session?.userId) {
    return NextResponse.redirect(new URL("/", req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$|.*\\.ico$|.*\\.svg$|.*\\.webmanifest$).*)"],
}
