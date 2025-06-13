import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI!;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// 환경변수 누락시 명확한 에러 메시지
if (!uri) {
  throw new Error('❌ MONGO_URI is not defined in environment variables!');
}

// 개발 환경에서는 전역 캐싱 사용
if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
