

import * as chai from 'chai';
const jsonfile = require('jsonfile'); // load database config
import { Config } from '../../etc/interface'; // database config interface

const expect = chai.expect;
const config: Config = jsonfile.readFileSync('etc/config.json');

import { NodeMySQLConnector } from './node-mysql-connector';
import { AccessDenied } from '../../etc/defines';



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

    it('Query error test', async() => {
        const db = await new NodeMySQLConnector(config.database).connect();
        const re = await db.query('SELECT ...').catch(e => e);
        expect(re).to.have.property('code');
        expect(re.code).to.equal('ER_PARSE_ERROR');
    });
});



