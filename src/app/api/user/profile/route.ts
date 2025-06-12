import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { v2 as cloudinary } from 'cloudinary'

export const runtime = 'nodejs'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const userEmail = session.user.email

  const formData = await request.formData()
  const name = formData.get('name')?.toString() || ''
  const description = formData.get('description')?.toString() || ''

  let avatarUrl: string | undefined
  const avatarFile = formData.get('avatar') as Blob | null
  if (avatarFile && avatarFile.size > 0) {
    // Blob → Buffer → base64 Data URI
    const arrayBuffer = await avatarFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const b64 = buffer.toString('base64')
    const mimeType = avatarFile.type || 'image/png'
    const dataUri = `data:${mimeType};base64,${b64}`

    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: 'avatars',
      public_id: userEmail.replace(/[@.]/g, '_'),
      overwrite: true,
    })

    avatarUrl = uploadResult.secure_url
  }

  const client = await clientPromise
  const users = client.db('your-db-name').collection('users')
  const updateFields: Record<string, any> = { name, description } // 설명 값 추가
  if (avatarUrl) updateFields.avatarUrl = avatarUrl

  await users.updateOne({ email: userEmail }, { $set: updateFields })

  return NextResponse.json({
    message: '프로필이 저장되었습니다.',
    avatarUrl,
    description,
  })
}
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const userEmail = session.user.email

  const client = await clientPromise
  const users = client.db('your-db-name').collection('users')
  const user = await users.findOne({ email: userEmail })

  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({
    name: user.name,
    avatarUrl: user.avatarUrl,
    description: user.description,
  })
}
