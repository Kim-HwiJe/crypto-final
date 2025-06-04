// types/next-connect.d.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import type { NextHandler } from 'next-connect'

declare module 'next-connect' {
  export default function nc<Req = NextApiRequest, Res = NextApiResponse>(): {
    use: (middleware: (req: Req, res: Res, next: NextHandler) => void) => any
    post: (handler: (req: Req, res: Res) => void | Promise<void>) => any
    // 필요한 경우 get, put 등도 추가 가능
  }
}
