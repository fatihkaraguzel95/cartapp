import { NextResponse, type NextRequest } from 'next/server'

// Auth is handled client-side — proxy just passes through
export async function proxy(request: NextRequest) {
  return NextResponse.next({ request })
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
