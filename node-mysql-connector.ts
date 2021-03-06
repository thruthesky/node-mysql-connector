/**
 * @file node-mysql-connecotr.ts
 * @description A typescript wrapper of
 *    https://github.com/sidorares/node-mysql2 which is based on
 *    https://github.com/mysqljs/mysql
 *
 * @note mysql2/promise is already a promise implementation.
 *      You can usee `await connection.query('...')`
 *
 * @see test code for details.
 */
import * as mysql from 'mysql2/promise';
import { ConnectionOptions } from 'mysql2/promise';
import { NoDBConnection } from './node-mysql-connector.define';
export { ConnectionOptions };


export class NodeMySQLConnector {

    constructor(private config: ConnectionOptions) {
    }

    /**
     * This property hold mysql.Connection.
     *
     * @note can be use to gain extra methods.
     */
    connection: mysql.Connection = null;

    /**
     * This method create connection and connects to database.
     *
     * @returns A promise of
     *      - Error code will be thrown on failure.
     *      - `NodeMySQLConnection` will be returned on success.
     */
    async connect(): Promise<NodeMySQLConnector> {
        this.connection = await (<any>mysql.createConnection({
            host: this.config.host,
            user: this.config.user,
            password: this.config.password,
            database: this.config.database
        })).then((conn: any) => {
            return conn;
        }).catch((e: any) => {
            return e;
        });
        return this;
    }

    /**
     * This methods disconnects to database.
     *
     * @returns A promise of;
     *      - Void will be returned on success.
     *      - Error code will be thrown on failure.
     */
    async disconnect(): Promise<void> {
        if (!this.connection) return Promise.reject(NoDBConnection);
        return await this.connection.end();
    }

    /**
     * This method run SQL statement.
     *
     * @param q SQL statement.
     *
     * @return A promise of
     *      - Error code will be thrown on failure.
     *      - Result will be return on success.
     * 
     * @proven Value will not be included in query because of the error 'escape is not a function'
     *         due to database is not connected.
     */
    async query(q: string): Promise<any> {
        if (!this.connection) return Promise.reject(NoDBConnection);
        const res = await this.connection.query(q);
        return res[0];
    }

    /**
     * This method create record on database.
     *
     * @param table database table.
     * @param fields table's fields.
     *
     * @returns A promise of
     *      - Error code will be thrown on failure.
     *      - OkPacket will be returned on success.
     * 
     * @proven 'escape is not a function' when database is not connected.
     */
    async insert(table: string, fields: any = {}): Promise<mysql.OkPacket> {
        if (!this.connection) return Promise.reject(NoDBConnection);
        const arr = [];
        for (const field of Object.keys(fields)) {
            let v: any;
            if (isNaN(fields[fields])) {
                v = this.connection.escape(fields[field]);
            } else {
                v = fields[field];
            }
            arr.push('`' + field + '`=' + v);
        }
        const q = `INSERT INTO ${table} SET ` + arr.join(',');
        return await this.query(q);
    }

    /**
     * This method update record on database.
     *
     * @param table database table.
     * @param fields table's fiels.
     * @param conds where clause.
     *
     * @returns A promise of
     *      - Error code will be thrown on failure.
     *      - OkPackect will be returned on success.
     * 
     * @proven 'escape is not a function' when database is not connected.
     */
    async update(table: string, fields: any = {}, conds: string): Promise<mysql.OkPacket> {
        if (!this.connection) return Promise.reject(NoDBConnection);
        const arr = [];
        for (const field of Object.keys(fields)) {
            let v: any;
            if (isNaN(fields[fields])) {
                v = this.connection.escape(fields[field]);
            } else {
                v = fields[field];
            }
            arr.push('`' + field + '`=' + v);
        }
        const q = `UPDATE ${table} SET ` + arr.join(',') + ` WHERE ${conds}`;
        return await this.query(q);
    }

    /**
     * This method will remove record on database.
     *
     * @param table database table.
     * @param conds where clause.
     *
     * @returns A promise of
     *      - Error code will be thrown on failure.
     *      - OkPacket will be returned on success.
     */
    async delete(table: string, conds: string): Promise<mysql.OkPacket> {
        return await this.query(`DELETE FROM ${table} WHERE ${conds}`);
    }

    /**
     * This method will fetch array of record set.
     *
     * @param q SQL statement.
     *
     * @returns An array of result set. Each element of the array is an object of the record(result).
     *
     * @example
     * [
     *      TextRow { idx: 1, name: 'Test', address: '32323', age: 0, gender: 0 },
     *      TextRow { idx: 2, name: '', address: '', age: 0, gender: 1 },
     *      TextRow { idx: 3, name: 'Unchanged', address: '32323', age: 0, gender: 0 },
     *      TextRow { idx: 4, name: 'Updated', address: '32323', age: 0, gender: 0 }
     * ]
     * Or an empty array if no data exists.
     * If an error happens, it will be delegated to parent.
     *
     */
    async rows(q: string): Promise<any> {
        return await this.query(q);
    }

    /**
     * This method will fetch result as objecct form.
     *
     * @param q SQL statement.
     *
     * @returns A promise of
     *      - Object of the first record.
     *      - Empty object if there is no result.
     *      - Error code on failure.
     */
    async row(q: string): Promise<any> {
        return await this.rows(q)
            .then(rows => {
                if (rows && rows.length) {
                    return rows[0];
                } else {
                    return {};
                }
            });
    }

    /**
     * This method return the value of the first field.
     *
     * @param q SQL statement.
     *
     * @returns A promise of
     *      - a scalar on success.
     *      - null if the query has no result set. (If query made for non-existing record)
     *      - error will be delegated to parent.
     */
    async result(q: string): Promise<number> {
        return await this.row(q)
            .then(row => {
                const keys = Object.keys(row);
                if (keys.length) {
                    const firstKey = keys.shift();
                    return row[firstKey];
                } else {
                    return null;
                }
            });
    }

    /**
     * This method will return no of record.
     *
     * @param table database table.
     * @param conds where clause.
     *
     * @returns A promise of
     *      - A number of record on success.
     *      - 0 if no match record.
     *      - Error code on failure.
     */
    async count(table: string, conds: string): Promise<any> {
        return await this.result(`SELECT COUNT(*) FROM ${table} WHERE ${conds}`);
    }
}
