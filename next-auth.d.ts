// next-auth.d.ts
import NextAuth from 'next-auth'
import { JWT as NextAuthJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      /** MongoDB ObjectId string */
      id: string
      name: string
      email: string
      /** URL of the user’s avatar */
      image: string
    }
  }

  interface User {
    /** We return this from authorize() */
    id: string
    name: string
    email: string
    picture?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub?: string
    name?: string
    email?: string
    picture?: string
  }
}
