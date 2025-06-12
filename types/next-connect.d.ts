import type { NextApiRequest, NextApiResponse } from 'next'
import type { NextHandler } from 'next-connect'

declare module 'next-connect' {
  export default function nc<Req = NextApiRequest, Res = NextApiResponse>(): {
    use: (middleware: (req: Req, res: Res, next: NextHandler) => void) => any
    post: (handler: (req: Req, res: Res) => void | Promise<void>) => any
  }
}
