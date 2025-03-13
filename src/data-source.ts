import "reflect-metadata"
import { DataSource } from 'typeorm';
import { Users } from './users/entities/user.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5433,
  username: 'postgres',
  password: '852456AA',
  database: 'homemade',
  entities: [Users],
  migrations: ['./migrations/*'],
});

export default AppDataSource;
