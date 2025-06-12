import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import clientPromise from '@/lib/mongodb'

import jsonwebtoken from 'jsonwebtoken'
import type { JWT } from 'next-auth/jwt'
import type { JWTEncodeParams, JWTDecodeParams } from 'next-auth/jwt'

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('❌ NEXTAUTH_SECRET is not defined in .env')
}

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
    maxAge: 2 * 60 * 60,
  },

  jwt: {
    maxAge: 2 * 60 * 60,

    async encode({ token, secret, maxAge }: JWTEncodeParams): Promise<string> {
      if (!token) throw new Error('No token to encode')
      const t = token as any
      const { exp, iat, aud, ...payload } = t

      return jsonwebtoken.sign(
        payload as Record<string, unknown>,
        secret as string,
        {
          algorithm: 'HS512',
          expiresIn: maxAge,
          audience: 'people',
        }
      )
    },

    async decode({ token, secret }: JWTDecodeParams): Promise<JWT | null> {
      if (!token) return null
      try {
        const decoded = jsonwebtoken.verify(token, secret as string, {
          algorithms: ['HS512'],
          audience: 'people',
        })
        return decoded as JWT
      } catch (err) {
        console.error('🔐 JWT 검증 실패:', err)
        return null
      }
    },
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
}
