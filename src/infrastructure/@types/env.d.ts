declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'test' | 'production';
    PORT: string;
    DATABASE_URL: string;
    JWT_SECRET: string;
    DB_HOST: string;
    DB_PORT: string;
    DB_USER: string;
    DB_PASS: string;
    DB_NAME: string;
  }
}
