import * as chai from 'chai';
const jsonfile = require('jsonfile'); // load database config
import { Config } from '../../etc/interface'; // database config interface

const expect = chai.expect;
const config: Config = jsonfile.readFileSync('modules/node-mysql-connector/config.json');

import { NodeMySQLConnector } from './node-mysql-connector';
import { AccessDenied, ParseError, WrongField, WrongValue,TableNotExist, ConnectionCountError } from './node-mysql-connector.interface';



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
        await db.connection.destroy();
    });

    // ======================
    //       Test Query
    // ======================

    it('Query error test', async () => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const re = await db.query('SELECT ...').catch(e => e);
        expect(re).to.have.property('code', ParseError);
        await db.connection.destroy();
    });

    it('Query success test', async () => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const re = await db.query('SELECT ROUND(1/1) as re').catch(e => e);
        expect(re).not.to.have.property('code', ParseError);
        expect(re[0]['re']).to.equal('1');
        await db.connection.destroy();
    });

    it('Connection count error test', async () => {
        let db = [];
        for ( let i = 0; i < 153 ; i++) {
            db[i] = await new NodeMySQLConnector(config.database).connect();
        };
        expect(db[152].connection).to.have.property('code', ConnectionCountError);
        await db[151].connection.destroy();
        await db[150].connection.destroy();
        await db[149].connection.destroy();
    });

    it('Connection count success test', async() => {
        const db = await new NodeMySQLConnector(config.database).connect();
        expect(db).to.not.have.property('code', ConnectionCountError);
        await db.connection.destroy();
    });

    // ======================
    //     Create Table
    // ======================

    it('Create Table', async() => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const q = `CREATE TABLE db_tests (
            idx int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
            name longtext NOT NULL,
            address longtext NOT NULL,
            PRIMARY KEY (idx)
          )`;
        const re = await db.query(q).catch(e => e);
        expect(re).to.not.have.property('code',ParseError);
        await db.connection.destroy();
    });


    // ======================
    //       Input Query
    // ======================

    it('Insert table not exists test', async () => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const re = await db.insert('db_not_exist', {name: 'Test', address: 32323, status: 423423}).catch(e => e);
        expect(re).to.have.property('code', TableNotExist);
        await db.connection.destroy();
    });

    it('Insert bad field test', async () => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const re = await db.insert('db_tests', {name: 'Test', address: 32323, status: 423423}).catch(e => e);
        expect(re).to.have.property('code', WrongField);
        await db.connection.destroy();
    });

    it('Insert success test', async () => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const re = await db.insert('db_tests', {name: 'Test', address: 32323}).catch(e => e);
        expect(re).to.have.property('affectedRows', 1);
        await db.connection.destroy();
    });

    // ======================
    //      Update Query
    // ======================

    it('Update change idx test', async () => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const res = await db.insert('db_tests', {name: 'Unchanged', address: 32323}).catch(e => e);
        const re = await db.update('db_tests',{ idx: 'sdadasd', name: 'Updated' }, `idx = ${res.insertId}`).catch(e => e);
        expect(re).to.have.property('code', WrongValue);
        await db.connection.destroy();
    });

    it('Update success test', async () => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const res = await db.insert('db_tests', {name: 'Unchanged', address: 32323}).catch(e => e);
        const re = await db.update('db_tests',{ name: 'Updated' }, `idx = ${res.insertId}`).catch(e => e);
        expect(res).to.have.property('affectedRows', 1);
        expect(re).to.have.property('affectedRows', 1);
        await db.connection.destroy();
    });

    // ======================
    //      Delete Query
    // ======================

    it('Delete non existent data test', async() => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const re = await db.delete('db_tests', 'idx = 10000000000000000000000000').catch(e => e);
        expect(re).to.have.property('affectedRows',0);
        await db.connection.destroy();
    });

    it('Delete success test', async() => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const res = await db.insert('db_tests', { name: 'To be deleted' , address: 'sdasda'}).catch(e => e);
        const re = await db.delete('db_tests', `idx = ${res.insertId}`).catch(e => e);
        expect(res).to.have.property('affectedRows', 1);
        expect(re).to.have.property('affectedRows', 1);
        await db.connection.destroy();
    });

    // ======================
    //      Rows Query
    // ======================

    it('Rows non existent data test', async () => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const res = await db.rows(`SELECT * FROM nothing_table`).catch(e => e);
        expect(res).to.have.property('code', TableNotExist);
        await db.connection.destroy();
    });

    it('Rows success test', async() => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const res = await db.rows(`SELECT * FROM db_tests LIMIT 20`).catch(e => e);
        expect(res).to.be.an('array');
        expect(res).to.have.property('length');
        await db.connection.destroy();
    });

    // ======================
    //      Rows Query
    // ======================

    it('Row non existent data test', async() => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const res = await db.row(`SELECT * FROM nothing_table`).catch(e => e);
        expect(res).to.have.property('code', TableNotExist);
        await db.connection.destroy();
    });

    it('Row success test', async() => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const res = await db.row(`SELECT * FROM db_tests LIMIT 20`).catch(e => e);
        expect(res).not.to.have.property('code', ParseError);
        expect(res).not.to.have.property('code', WrongField);
        expect(res).not.to.have.property('code', TableNotExist);
        expect(res).to.be.an('object');
        await db.connection.destroy();
    });

    // ======================
    //      Result Query
    // ======================

    it('Result non existent data test', async() => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const res = await db.result(`SELECT * FROM nothing_table`).catch(e => e);
        expect(res).to.have.property('code', TableNotExist);
        await db.connection.destroy();
    });

    it('Result success test', async() => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const res = await db.result(`SELECT * FROM db_tests LIMIT 20`).catch(e => e);
        expect(res).not.to.have.property('code', ParseError);
        expect(res).not.to.have.property('code', WrongField);
        expect(res).not.to.have.property('code', TableNotExist);
        await db.connection.destroy();
    });

    // ======================
    //      Result Query
    // ======================

    it('Result non existent data test', async() => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const res = await db.count(`nothing_table`, `idx = 1`).catch(e => e);
        expect(res).to.have.property('code', TableNotExist);
        await db.connection.destroy();
    });

    it('Result success test', async() => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const res = await db.count(`db_tests`, `idx = 1`).catch(e => e);
        expect(res).not.to.have.property('code', ParseError);
        expect(res).not.to.have.property('code', WrongField);
        expect(res).not.to.have.property('code', TableNotExist);
        await db.connection.destroy();
    });

    // ======================
    //      DROP TABLE
    // ======================

    it('Drop Table', async() => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const q = `DROP TABLE db_tests`;
        const re = await db.query(q).catch(e => e);
        expect(re).to.not.have.property('code',ParseError);
        await db.connection.destroy();
    });
});