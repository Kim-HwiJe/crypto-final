// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import clientPromise from '@/lib/mongodb'

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
        if (!user) {
          throw new Error('USER_NOT_FOUND')
        }
        const isValid = await compare(credentials!.password, user.password)
        if (!isValid) {
          throw new Error('PASSWORD_INCORRECT')
        }
        // image 필드에 DB에 저장된 avatarUrl 을 담아 반환
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
  session: { strategy: 'jwt' },

  callbacks: {
    // JWT 생성/갱신 시: 최초 로그인 시 user 가 있고, 이후엔 DB 조회
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name
        token.email = user.email
        if (user.image) token.picture = user.image as string
      } else if (token.email) {
        const client = await clientPromise
        const dbUser = await client
          .db()
          .collection('users')
          .findOne({ email: token.email })
        if (dbUser?.avatarUrl) {
          token.picture = dbUser.avatarUrl
        }
      }
      return token
    },
    // 클라이언트로 내려줄 session 객체에 picture 반영
    async session({ session, token }) {
      session.user = {
        ...session.user!,
        name: token.name as string,
        email: token.email as string,
        image: (token.picture as string) || session.user?.image,
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
