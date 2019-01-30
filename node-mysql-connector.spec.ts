import * as chai from 'chai';
const jsonfile = require('jsonfile'); // load database config
import { Config } from '../../etc/interface'; // database config interface

const expect = chai.expect;
const config: Config = jsonfile.readFileSync('modules/node-mysql-connector/config.json');

import { NodeMySQLConnector } from './node-mysql-connector';
import { ParseError, FieldError, FieldWrongValue, TableNotExist, ConnectionCountError, NullError, TableError } from './node-mysql-connector.define';


describe('[ Database Connection Test ]', () => {
    it('Connection error test', async () => {
        // Make wrong password
        const cfg = Object.assign({}, config.database);
        cfg.password = '111111';

        /**
         * If there is error on connection, then `db.connection.code` has error code.
         */
        const db = new NodeMySQLConnector(cfg);
        await db.connect();
        expect(db.connection).not.to.be.null;
        expect(db.connection).to.have.property('code');
    });

    it('Connection success test', async () => {
        /**
         * If connection success, there is 'code' property on db.connection.
         */
        const db = new NodeMySQLConnector(config.database);
        await db.connect();
        expect(db.connection).not.to.be.null;
        expect(db.connection).not.to.have.property('code');
        await db.disconnect();
    });

    // ======================
    //       Test Query
    // ======================

    it('Query error test', async () => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const re = await db.query('SELECT ...').catch(e => e);
        expect(re).to.have.property('code', ParseError);
        await db.disconnect();
    });

    it('Query success test', async () => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const re = await db.query('SELECT ROUND(1/1) as re').catch(e => e);
        expect(re).not.to.have.property('code', ParseError);
        expect(re[0]['re']).to.equal('1');
        await db.disconnect();
    });

    it('Connection count error test by comsuming all available connections', async () => {
        let dbContainer: NodeMySQLConnector[] = [];
        let db: NodeMySQLConnector = null;

        /**
         * Consume all the available connections
         */
        while (1) {
            db = await new NodeMySQLConnector(config.database).connect();
            if (db.connection['code'] && db.connection['code'] === ConnectionCountError) {
                break;
            }
            dbContainer.push(db);
        }
        expect(db.connection).to.have.property('code', ConnectionCountError);

        // disconnect 1
        await dbContainer.pop().disconnect();

        // connect 1
        db = await new NodeMySQLConnector(config.database).connect();
        expect(db.connection).not.to.be.null;
        expect(db.connection).not.to.have.property('code');

        // free all connections
        for (const db of dbContainer) {
            await db.disconnect();
        }
    });
});


let db: NodeMySQLConnector = null;
describe('[ Database Query Test ]', () => {
    beforeEach(async () => {
        db = await new NodeMySQLConnector(config.database).connect();
    });
    afterEach(async () => {
       await db.disconnect();
    })
    // ======================
    //     Create Table
    // ======================

    it('Create Table', async () => {
        const q = `CREATE TABLE db_tests (
            idx int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
            name longtext NOT NULL default '',
            address longtext NOT NULL default '',
            age int(1) default '0',
            gender boolean default false,
            PRIMARY KEY (idx)
          )`;
        const re = await db.query(q).catch(e => e);
        expect(re).to.not.have.property('code', ParseError);
    });


    // ======================
    //       Input Query
    // ======================

    it('Insert table not exists test', async () => {
        const re = await db.insert('db_not_exist', { name: 'Test', address: 32323, status: 423423 }).catch(e => e);
        expect(re).to.have.property('code', TableNotExist);
    });

    it('Insert bad field test', async () => {
        const re = await db.insert('db_tests', { name: 'Test', address: 32323, status: 423423 }).catch(e => e);
        expect(re).to.have.property('code', FieldError);
    });

    it('Insert null field test', async () => {
        const re = await db.insert('db_tests', { name: null, address: 32323 }).catch(e => e);
        expect(re).to.have.property('code', NullError);
    });

    it('Insert success test', async () => {
        const re = await db.insert('db_tests', { name: 'Test', address: 32323 }).catch(e => e);
        expect(re).to.have.property('affectedRows', 1);
    });

    /**
     * Boolean is `tinyint(1)` in mysql.
     * - true becomes 1 on boolean
     * - false becomes 0 on boolean
     */
    it('Insert boolean test', async () => {
        let res = await db.insert('db_tests', { gender: true });
        res = await <any>db.result(`SELECT gender FROM db_tests WHERE idx=${res.insertId}`);
        expect(res).to.equal(1);
    });


    // ======================
    //      Update Query
    // ======================

    it('Update change idx test', async () => {
        const res = await db.insert('db_tests', { name: 'Unchanged', address: 32323 });
        const re = await db.update('db_tests', { idx: 'sdadasd', name: 'Updated' }, `idx = ${res.insertId}`).catch(e => e);
        expect(re).to.have.property('code', FieldWrongValue);
    });

    it('Update null test', async () => {
        const res = await db.insert('db_tests', { name: 'Unchanged', address: 32323 });
        const re = await db.update('db_tests', { name: null }, `idx = ${res.insertId}`).catch(e => e);
        expect(re).to.have.property('code', NullError);
    });

    it('Update success test', async () => {
        const res = await db.insert('db_tests', { name: 'Unchanged', address: 32323 });
        const re = await db.update('db_tests', { name: 'Updated' }, `idx = ${res.insertId}`);
        expect(res).to.have.property('affectedRows', 1);
        expect(re).to.have.property('affectedRows', 1);
    });

    it('Update on non existing record', async () => {
        const res = await db.update('db_tests', { name: 'Updated' }, `idx = 1111111111111111111111111111`).catch(e => e);
        expect(res).to.have.property('affectedRows', 0);
    });

    // ======================
    //      Delete Query
    // ======================

    it('Delete non existent data test', async () => {
        const re = await db.delete('db_tests', 'idx = 10000000000000000000000000').catch(e => e);
        expect(re).to.have.property('affectedRows', 0);
    });

    it('Delete null test', async () => {
        const re = await db.delete('db_tests', `idx = ${null}`).catch(e => e);
        expect(re).to.have.property('affectedRows', 0);
    });

    it('Delete success test', async () => {
        const res = await db.insert('db_tests', { name: 'To be deleted', address: 'sdasda' });
        const re = await db.delete('db_tests', `idx = ${res.insertId}`);
        expect(res).to.have.property('affectedRows', 1);
        expect(re).to.have.property('affectedRows', 1);
    });

    // ======================
    //      Rows Query
    // ======================

    it('Rows non existent data test', async () => {
        const res = await db.rows(`SELECT * FROM nothing_table`).catch(e => e);
        expect(res).to.have.property('code', TableNotExist);
    });

    it('Rows null table test', async () => {
        const res = await db.rows(`SELECT * FROM ${null}`).catch(e => e);
        expect(res).to.have.property('code', ParseError);
    });

    it('Rows success test', async () => {
        const res = await db.rows(`SELECT * FROM db_tests LIMIT 20`);
        expect(res).to.be.an('array');
        expect(res).to.have.property('length');
    });

    it('rows() with non-existing records.', async () => {
        const res = await db.rows(`SELECT * FROM db_tests WHERE idx=0`);
        expect(res).to.be.an('array');
        expect(res).to.have.property('length', 0);
    });


    // ======================
    //      Row Query
    // ======================

    it('Row non existent data test', async () => {
        const res = await db.row(`SELECT * FROM nothing_table`).catch(e => e);
        expect(res).to.have.property('code', TableNotExist);
    });

    it('Row success test', async () => {
        const res = await db.row(`SELECT * FROM db_tests LIMIT 20`);
        expect(res).not.to.have.property('code');
        expect(res).to.be.an('object');
    });

    it('row() on non existing record', async () => {
        const res = await db.row(`SELECT * FROM db_tests WHERE idx=0`);
        expect(res).to.be.an('object');
    });

    // ======================
    //      Result Query
    // ======================

    it('Result non existent data test', async () => {
        const res = await db.result(`SELECT * FROM nothing_table`).catch(e => e);
        expect(res).to.have.property('code', TableNotExist);
    });

    it('Result success test', async () => {
        const res = await db.result(`SELECT * FROM db_tests LIMIT 20`);
        expect(res).not.to.have.property('code');
    });

    it('result() on non-existing record', async () => {
        const res = await db.result(`SELECT * FROM db_tests where idx=0`);
        expect(res).to.be.null;
    });


    // ======================
    //      Count Query
    // ======================

    it('Result non existent data test', async () => {
        const res = await db.count(`nothing_table`, `idx = 1`).catch(e => e);
        expect(res).to.have.property('code', TableNotExist);
    });

    it('Result success test', async () => {
        const res = await db.count(`db_tests`, `idx = 1`);
        expect(res).to.equal(1);
    });
    it('result() on non-existing record. expecting to be 0.', async () => {
        const res = await db.count(`db_tests`, `idx = 0`);
        expect(res).to.equal(0);
    });

    // ======================
    //      DROP TABLE
    // ======================

    it('Drop Table', async () => {
        let q = `DROP TABLE db_tests`;
        let re = await db.query(q).catch(e => e);
        expect(re).to.not.have.property('code');

        q = `DROP TABLE db_tests`;
        re = await db.query(q).catch(e => e);
        expect(re).to.have.property('code', TableError);

    });
});