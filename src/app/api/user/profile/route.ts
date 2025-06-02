import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
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
  const url = new URL(request.url)

  // 1) 쿼리 파라미터에 email=값이 있으면, 해당 이메일 사용자 프로필을 조회
  const queryEmail = url.searchParams.get('email')
  let targetEmail: string | null = null

  if (queryEmail) {
    // 쿼리스트링으로 넘어온 email이 우선
    targetEmail = queryEmail
  } else {
    // 없으면 세션 기반으로 내 이메일을 가져옴(원래 로직)
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    targetEmail = session.user.email
  }

  // 2) MongoDB에서 targetEmail로 사용자 정보 조회
  const client = await clientPromise
  const db = client.db('your-db-name')
  const users = db.collection('users')

  const user = await users.findOne(
    { email: targetEmail },
    { projection: { password: 0 } }
  )
  if (!user) {
    return NextResponse.json(
      { message: '사용자를 찾을 수 없습니다.' },
      { status: 404 }
    )
  }

  // 3) 프로필 정보 반환: name, avatarUrl, description
  return NextResponse.json({
    name: user.name,
    avatarUrl: user.avatarUrl || '/default-avatar.png',
    description: user.description || '',
  })
}
