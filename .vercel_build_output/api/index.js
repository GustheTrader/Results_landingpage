import { handle } from 'hono/vercel';
import app from '../src/index.tsx';
export default handle(app);
