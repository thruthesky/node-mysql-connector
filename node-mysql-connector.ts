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

const mysql = require('mysql2/promise');

export class NodeMySQLConnector {
    connection = null;
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
        this.connection = await mysql.createConnection({
            host: this.config.host,
            user: this.config.user,
            password: this.config.password,
            database: this.config.database
        }).catch(e => e);
        return this;
    }

    /**
     * @note this function connects to database and release the connection after work is done.
     * * pool.getConnection -> connection.query -> connection.release.
     *
     * @param q SQL statement.
     */
    query(q: string): Promise<any> {
        return this.connection.query(q);
    }

    /**
     * Will run insert query.
     *
     * @param table database table.
     * @param fields table's fields.
     */
    insert(table: string, fields: any = {}): Promise<any> {
        fields.stamp_created = Math.floor((new Date().getTime()) / 1000);
        fields.stamp_updated = Math.floor((new Date().getTime()) / 1000);
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
        fields.stamp_updated = Math.floor((new Date().getTime()) / 1000);
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
     *    object of the record.
     *    empty object if there is no result.
     *    if error, an error is thrown.
     */
    async row(q: string): Promise<any> {
        return await this.rows(q)
            .then(rows => {
                if (rows && rows.length) {
                    return rows[0][0];
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
     */
    async result(q: string): Promise<any> {
        return await this.row(q)
            .then(row => {
                if (row) {
                    const keys = Object.keys(row);
                    if (keys && keys.length) {
                        const firstKey = keys.shift();
                        return row[firstKey];
                    }
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
