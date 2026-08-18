import path from 'path';
import { defineConfig } from 'prisma/config';

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const dbUrl = `file:${dbPath}`;

export default defineConfig({
  schema: path.join(process.cwd(), 'prisma/schema.prisma'),
  datasource: {
    url: dbUrl,
  },
});
