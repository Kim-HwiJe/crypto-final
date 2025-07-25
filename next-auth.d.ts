import NextAuth from 'next-auth'
import { JWT as NextAuthJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      image: string
    }
  }

  interface User {
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
