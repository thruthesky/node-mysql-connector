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
import { Config } from "./node-mysql-connector.interface";



// const mysql = require('mysql2/promise');
import * as mysql from 'mysql2/promise';


export class NodeMySQLConnector {
    connection: mysql.Connection = null;
    constructor(private config: Config) {
    }


    /**
     * This method connects to database.
     *
     * @note this should be use for testing connection only.
     *  - if connected release connection and use query function.
     *  - else display error.
     *
     * @return A promise of
     *    - false if failed on connection. In this case, this.connection.code has the error code.
     *    - `NodeMySQLConnection` will be returned on success.
     */
    async connect(): Promise<NodeMySQLConnector> {
        this.connection = await (<any>mysql.createConnection({
            host: this.config.host,
            user: this.config.user,
            password: this.config.password,
            database: this.config.database
        })).catch(e => e);
        return this;
    }

    disconnect() {
        return this.connection.destroy();
    }

    /**
     * @param q SQL statement.
     * @return array<any>.
     */
    async query(q: string): Promise<any> {
        const res = await this.connection.query(q);
        return res[0];
    }


    /**
     * Will run insert query.
     *
     * @param table database table.
     * @param fields table's fields.
     */
    insert(table: string, fields: any = {}): Promise<any> {
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
        return this.query(q);
    }

    /**
     * Will run update query.
     *
     * @param table database table.
     * @param fields table's fiels.
     * @param conds where clause.
     */
    update(table: string, fields: any = {}, conds: string): Promise<any> {
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
        return this.query(q);
    }

    /**
     * Will run delete query.
     *
     * @param table database table.
     * @param conds where clause.
     */
    delete(table: string, conds: string): Promise<any> {
        return this.query(`DELETE FROM ${table} WHERE ${conds}`);
    }

    /**
     * Will run select query and return result that matched the condition.
     *
     * @param q SQL statement.
     * @returns
     * An array of result set. Each element of the array is an object of the record(result).
     *      Example)
                [
                    TextRow { idx: 1, name: 'Test', address: '32323', age: 0, gender: 0 },
                    TextRow { idx: 2, name: '', address: '', age: 0, gender: 1 },
                    TextRow { idx: 3, name: 'Unchanged', address: '32323', age: 0, gender: 0 },
                    TextRow { idx: 4, name: 'Updated', address: '32323', age: 0, gender: 0 }
                ]
     * Or an empty array if no data exists.
     * If an error happens, it will be delegated to parent.
     *
     */
    rows(q: string): Promise<any> {
        return this.query(q);
    }


    /**
     * Will run 'rows' under the surface,
     * will get the first index of the array.
     *
     * @param q SQL statement.
     *
     * @returns
     *    Object of the first record.
     *    Empty object if there is no result.
     *    If error, an error is thrown.
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
     * Will run 'row' under the surface,
     * will get the first field of the object.
     *
     * @param q SQL statement.
     * @returns
     *  a scalar on success.
     *  null if the query has no result set. (If query made for non-existing record)
     *  error will be delegated to parent.
     */
    async result(q: string): Promise<any> {
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
   * Will run count query.
   *
   * @param q SQL statement.
   */
    count(table: string, conds: string): Promise<any> {
        return this.result(`SELECT COUNT(*) FROM ${table} WHERE ${conds}`);
    }
}
