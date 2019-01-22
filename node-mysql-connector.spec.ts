import * as chai from 'chai';
const jsonfile = require('jsonfile'); // load database config
import { Config } from '../../etc/interface'; // database config interface

const expect = chai.expect;
const config: Config = jsonfile.readFileSync('modules/node-mysql-connector/config.json');

import { NodeMySQLConnector } from './node-mysql-connector';
import { AccessDenied, ParseError, FieldError, TableNotExist } from './node-mysql-connector.interface';



describe('[ Database Test ]', () => {
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
        expect(db.connection.code).to.equal(AccessDenied);
    });

    it('Connection success test', async () => {
        /**
         * If connection success, there is 'code' property on db.connection.
         */
        const db = new NodeMySQLConnector(config.database);
        await db.connect();
        expect(db.connection).not.to.be.null;
        expect(db.connection).not.to.have.property('code');
        expect(db.connection.code).not.equal(AccessDenied);
    });

    // ======================
    //       Test Query
    // ======================

    it('Query error test', async () => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const re = await db.query('SELECT ...').catch(e => e);
        expect(re).to.have.property('code',ParseError);
    });

    it('Query success test', async () => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const re = await db.query('SELECT 1/1').catch(e => e);
        expect(re).not.to.have.property('code',ParseError);
    });

    // ======================
    //       Input Query
    // ======================

    it('Insert table not exists test', async () => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const re = await db.insert('sp_not_exist', {name: 'Test', address: 32323, status: 423423}).catch(e => e);
        expect(re).to.have.property('code', TableNotExist);
    });

    it('Insert bad field test', async () => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const re = await db.insert('sp_tests', {name: 'Test', address: 32323, status: 423423}).catch(e => e);
        expect(re).to.have.property('code', FieldError);
    });

    it('Insert success test', async () => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const re = await db.insert('sp_tests', {name: 'Test', address: 32323}).catch(e => e);
        expect(re[0]).to.have.property('affectedRows', 1);
    });

    // ======================
    //      Update Query
    // ======================

    it('Update change idx test', async () => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const res = await db.insert('sp_tests', {name: 'Unchanged', address: 32323}).catch(e => e);
        const re = await db.update('sp_tests',{ idx: 999, name: 'Updated' }, `idx = ${res.insertId}`).catch(e => e);
        expect(re).to.have.property('code', FieldError);
    });

    it('Update success test', async () => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const res = await db.insert('sp_tests', {name: 'Unchanged', address: 32323}).catch(e => e);
        const re = await db.update('sp_tests',{ name: 'Updated' }, `idx = ${res[0].insertId}`).catch(e => e);
        expect(res[0]).to.have.property('affectedRows', 1);
        expect(re[0]).to.have.property('affectedRows', 1);
    });

    // ======================
    //      Delete Query
    // ======================

    it('Delete non existent data test', async() => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const re = await db.delete('sp_tests', 'idx = 10000000000000000000000000').catch(e => e);
        expect(re[0]).to.have.property('affectedRows',0);
    });

    it('Delete success test', async() => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const res = await db.insert('sp_tests', { name: 'To be deleted'}).catch(e => e);
        const re = await db.delete('sp_tests', `idx = ${res[0].insertId}`).catch(e => e);
        expect(res[0]).to.have.property('affectedRows', 1);
        expect(re[0]).to.have.property('affectedRows', 1);
    });

    // ======================
    //      Rows Query
    // ======================

    it('Rows non existent data test', async () => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const res = await db.rows(`SELECT * FROM nothing_table`).catch(e => e);
        expect(res).to.have.property('code', TableNotExist);
    });

    it('Rows success test', async() => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const res = await db.rows(`SELECT * FROM sp_tests LIMIT 20`).catch(e => e);
        expect(res[0]).to.be.an('array');
        expect(res[0].length).is.equal(20);
    });

    // ======================
    //      Rows Query
    // ======================

    it('Row non existent data test', async() => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const res = await db.row(`SELECT * FROM nothing_table`).catch(e => e);
        expect(res).to.have.property('code', TableNotExist);
    });

    it('Row success test', async() => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const res = await db.row(`SELECT * FROM sp_tests LIMIT 20`).catch(e => e);
        expect(res).not.to.have.property('code', ParseError);
        expect(res).not.to.have.property('code', FieldError);
        expect(res).not.to.have.property('code', TableNotExist);
        expect(res).to.be.an('object');
    });

    // ======================
    //      Result Query
    // ======================

    it('Result non existent data test', async() => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const res = await db.result(`SELECT * FROM nothing_table`).catch(e => e);
        expect(res).to.have.property('code', TableNotExist);
    });

    it('Result success test', async() => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const res = await db.result(`SELECT * FROM sp_tests LIMIT 20`).catch(e => e);
        expect(res).not.to.have.property('code', ParseError);
        expect(res).not.to.have.property('code', FieldError);
        expect(res).not.to.have.property('code', TableNotExist);
    });

    // ======================
    //      Result Query
    // ======================

    it('Result non existent data test', async() => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const res = await db.count(`nothing_table`, `idx = 1`).catch(e => e);
        expect(res).to.have.property('code', TableNotExist);
    });

    it('Result success test', async() => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const res = await db.count(`sp_tests`, `idx = 1`).catch(e => e);
        expect(res).not.to.have.property('code', ParseError);
        expect(res).not.to.have.property('code', FieldError);
        expect(res).not.to.have.property('code', TableNotExist);
    });

});