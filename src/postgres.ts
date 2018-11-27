import * as knex from 'knex';
import { Notification, Pool, QueryResult } from 'pg';
import { createPool } from './createPool';
import { logger } from './logger';

import { DatabaseWrapper, DBQueryBuilder, DBQueryField, DBQueryResult, DBQuerySQLReturn } from 'wraps-base';
import { DbConfiguration, PGQueryParameters, TransactionClient } from './definitions';

export class Postgres implements DatabaseWrapper {
  private sqlGenerator: knex = knex({
    debug: false,
    dialect: 'postgresql',
  });

  /** Postgres native driver access */
  private pool: Pool;

  constructor(opts: DbConfiguration = {}) {
    this.pool = createPool(opts);
    this.pool.on('error', (err: Error) => {
      logger.error(`Database pool error: ${err.stack}`);
    });
  }

  /** Query builder (knex) */
  public get sql(): knex {
    return this.sqlGenerator;
  }

  /** Runs a query from the connection pool */
  public async query(sql: knex.QueryBuilder | string, transaction?: TransactionClient): Promise<DBQueryResult> {
    const query = this.buildSql(sql);
    logger.silly('Query: ', query);
    let client;
    if (transaction) client = transaction.client;
    else client = this.pool;
    return this.convertPGToQueryReturn(await client.query(query));
  }

  /** Gets a transaction client from query pool. **Important: Remember to call releaseTransaction() when finished!** */
  public async getTransaction(): Promise<TransactionClient> {
    const trx: TransactionClient = {
      client: await this.pool.connect(),
      errors: [],
      notifications: [],
    };
    trx.client.on('error', (err: Error) => {
      logger.warn('Error on transaction: ', err);
      trx.errors.push(err);
    });
    trx.client.on('notification', (msg: Notification) => {
      trx.notifications.push(msg);
      logger.silly(msg);
    });
    return trx;
  }

  /** Release client from pool
   * @param trx: Postgresql client transaction
   */
  public releaseTransaction(trx: TransactionClient): void {
    trx.client.release();
  }

  private parseQueryToPostgres(query: DBQuerySQLReturn): PGQueryParameters {
    return {
      text: query.sql,
      values: query.bindings,
    };
  }

  /** Parse string / knex query into postgresql native format */
  private buildSql(sql: knex.QueryBuilder | string): string | PGQueryParameters {
    if (typeof sql === 'string') return sql;
    // Query comes from knex builder. Convert to Postgresql format
    return this.parseQueryToPostgres((sql as DBQueryBuilder).toSQL().toNative());
  }

  private convertPGToQueryReturn(result: QueryResult): DBQueryResult {
    return {
      rowCount: result.rowCount,
      rows: result.rows,
      // tslint:disable-next-line:object-literal-sort-keys
      fields: result.fields.map((field): DBQueryField => ({ name: field.name, type: field.dataTypeID.toString() })),
    };
  }
}
