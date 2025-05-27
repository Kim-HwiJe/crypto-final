import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'
import { v2 as cloudinary } from 'cloudinary'

// Node.js 런타임 사용
export const runtime = 'nodejs'

// Cloudinary 설정
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export async function POST(request: Request) {
  // 1) 세션 확인
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const userEmail = session.user.email

  // 2) FormData 파싱
  const formData = await request.formData()
  const name = formData.get('name')?.toString() || ''
  const description = formData.get('description')?.toString() || '' // 설명 값 추가

  // 3) Cloudinary에 avatar 업로드
  let avatarUrl: string | undefined
  const avatarFile = formData.get('avatar') as Blob | null
  if (avatarFile && avatarFile.size > 0) {
    // Blob → Buffer → base64 Data URI
    const arrayBuffer = await avatarFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const b64 = buffer.toString('base64')
    const mimeType = avatarFile.type || 'image/png'
    const dataUri = `data:${mimeType};base64,${b64}`

    // 업로드 옵션: avatars 폴더, 이메일 기반 public_id
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: 'avatars',
      public_id: userEmail.replace(/[@.]/g, '_'),
      overwrite: true,
    })

    avatarUrl = uploadResult.secure_url
  }

  // 4) MongoDB 업데이트
  const client = await clientPromise
  const users = client.db('your-db-name').collection('users')
  const updateFields: Record<string, any> = { name, description } // 설명 값 추가
  if (avatarUrl) updateFields.avatarUrl = avatarUrl

  await users.updateOne({ email: userEmail }, { $set: updateFields })

  // 5) 응답
  return NextResponse.json({
    message: '프로필이 저장되었습니다.',
    avatarUrl, // 프론트에서 이 URL로 preview 갱신 가능
    description,
  })
}
export async function GET(request: Request) {
  // 1) 세션 확인
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const userEmail = session.user.email

  // 2) 사용자 프로필 정보 가져오기
  const client = await clientPromise
  const users = client.db('your-db-name').collection('users')
  const user = await users.findOne({ email: userEmail })

  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 })
  }

  // 3) 사용자 프로필 반환
  return NextResponse.json({
    name: user.name,
    avatarUrl: user.avatarUrl,
    description: user.description, // 설명 추가
  })
}
