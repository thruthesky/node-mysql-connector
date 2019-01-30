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
            // console.log('Database connected...!');
            return conn;
        }).catch((e: any) => e);
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
        return this.connection.end();
    }

    /**
     * This method run SQL statement.
     *
     * @param q SQL statement.
     *
     * @return A promise of
     *      - Error code will be thrown on failure.
     *      - Result will be return on success.
     */
    async query(q: string): Promise<any> {

        // console.log(` => q: ${q}`);
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
     */
    async insert(table: string, fields: any = {}): Promise<mysql.OkPacket> {
        // console.log(' => node-mysql-connector::insert: ', table, fields);
        const arr = [];
        const keys = Object.keys(fields);
        // console.log('keys: ', keys);
        try {
            for (const field of keys) {
                let v: any;
                if (isNaN(fields[fields])) {
                    v = this.connection.escape(fields[field]);
                } else {
                    v = fields[field];
                }
                arr.push('`' + field + '`=' + v);
            }
        } catch (e) {
            // don't do anything here.
            // just deliver the error to the database query, so the error is being handled by the database query.
            // console.log(e.message);
        }

        // console.log('arr: ', arr);
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
     */
    update(table: string, fields: any = {}, conds: string): Promise<mysql.OkPacket> {
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
     * This method will remove record on database.
     *
     * @param table database table.
     * @param conds where clause.
     *
     * @returns A promise of
     *      - Error code will be thrown on failure.
     *      - OkPacket will be returned on success.
     */
    delete(table: string, conds: string): Promise<mysql.OkPacket> {
        return this.query(`DELETE FROM ${table} WHERE ${conds}`);
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
    rows(q: string): Promise<any> {
        return this.query(q);
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
    count(table: string, conds: string): Promise<any> {
        return this.result(`SELECT COUNT(*) FROM ${table} WHERE ${conds}`);
    }
}
