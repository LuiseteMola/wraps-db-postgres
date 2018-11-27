import { Pool, types } from "pg";
import { DbConfiguration } from './definitions';
import { logger } from './logger';

// Postgresql column types for type parsing
const PGTYPE_TIMESTAMPTZ_OID = 1184;
const PGTYPE_TIMESTAMP_OID = 1114;
const PGTYPE_DATE = 1082;

const PGMAX_CONNECTIONS_DEFAULT = 10;

function showConfigBanner () {
    logger.error('*****************************************************************************************************');
    logger.error('ERROR: database connection data is not configured. Please, export the following environment variables');
    logger.error('*****************************************************************************************************');
    logger.error('PGHOST: Database host | PGUSER: Database login username | PGPASSWORD: Database password | PGDATABASE: Database name | PGPORT: Database port');
    throw new Error('Database is not configured');

}

export function createPool(opts: DbConfiguration = {}): Pool {
    const maxConnections = Number(process.env.PGMAX_CONNECTIONS) || PGMAX_CONNECTIONS_DEFAULT;
    const host = opts.host || process.env.PGHOST;
    const username = opts.username || process.env.PGUSER;
    const password = opts.password || process.env.PGPASSWORD;
    const database = opts.database || process.env.PGDATABASE;
    const port: number = opts.port || Number(process.env.PGPORT);

    if (!host) showConfigBanner();

    // Creates new connection pool
    logger.info('Starting database pool...');
    if (!maxConnections) logger.info(`Connection pool length is not set. Please export PGMAX_CONNECTIONS environment variable. Defaults to ${maxConnections}`);
    logger.info('Pool length: ', maxConnections);

    // Date parsing "as is". Do not convert to javascript date
    // Default format retrieved by database: YYYY-MM-DD
    types.setTypeParser(PGTYPE_DATE, val => val);

    return new Pool({
        database: database,
        host: host,
        idleTimeoutMillis: 60000, // Max idle time: 60 seconds
        max: maxConnections,
        password: password,
        port: port,
        user: username,
    });
}
