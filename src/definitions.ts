import { QueryBuilder, Sql } from 'knex';
import { Notification, PoolClient } from 'pg';
import { Logger } from 'wraps-logger';

export interface DbConfiguration {
  logger?: Logger;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
}

export interface PGQuerySQLReturn {
  sql: string;
  bindings: Array<string>;
}

interface PGQuerySQL extends Sql {
  toNative(): PGQuerySQLReturn;
}

interface PGQueryBuilder extends QueryBuilder {
  toSQL(): PGQuerySQL;
}

export interface PGQueryParameters {
  text: string;
  values: string[];
}

export interface TransactionClient {
  client: PoolClient;
  notifications: Array<Notification>;
  errors: Array<Error>;
}
