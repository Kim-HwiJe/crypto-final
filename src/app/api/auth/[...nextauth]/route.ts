// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth/next'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import clientPromise from '@/lib/mongodb'

// (If you added custom JWT encode/decode, you can re-add it below in the exact shape NextAuth expects.)

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const client = await clientPromise
        const users = client.db('your-db-name').collection('users')
        const user = await users.findOne({ email: credentials?.email })
        if (!user) throw new Error('USER_NOT_FOUND')
        const isValid = await compare(credentials!.password, user.password)
        if (!isValid) throw new Error('PASSWORD_INCORRECT')
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.avatarUrl || '/default-avatar.png',
        }
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 2 * 60 * 60, // 2 hours
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.name = user.name
        token.email = user.email
        token.picture = (user as any).image
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        id: token.sub! as string,
        name: token.name! as string,
        email: token.email! as string,
        image: token.picture! as string,
      }
      return session
    },
  },

  // If you need custom JWT signing (HS512, audience, etc),
  // you can add the `jwt` block here, but start simple and
  // re-introduce it once the basic flow works.
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
