import { handle } from 'hono/vercel'

// Import the Hono app
import app from '../src/index'

// Export the Vercel handler
export default handle(app)

