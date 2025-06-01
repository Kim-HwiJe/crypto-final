// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// NextAuth 핸들러만 export 합니다. (authOptions은 여기서 export 하지 않습니다.)
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
