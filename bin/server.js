#!/usr/bin/env node

import 'localenv';
import optimist from 'optimist';

import log from 'book';
import Debug from 'debug';

import CreateServer from '../server.js';

const debug = Debug('mytunnel');

const argv = optimist
    .usage('Usage: $0 --port [num]')
    .options('secure', {
        default: false,
        describe: 'use this flag to indicate proxy over https'
    })
    .options('port', {
        default: '80',
        describe: 'listen on this port for outside requests'
    })
    .options('address', {
        default: '0.0.0.0',
        describe: 'IP address to bind to'
    })
    .options('domain', {
        describe: 'Specify the base domain name. This is optional if hosting localtunnel from a regular example.com domain. This is required if hosting a localtunnel server from a subdomain (i.e. lt.example.dom where clients will be client-app.lt.example.come)',
    })
    .options('max-sockets', {
        default: 10,
        describe: 'maximum number of tcp sockets each client is allowed to establish at one time (the tunnels)'
    })
    .options('tunnel-ssl-cert', {
        describe: 'the ssl cert for encrypting the tunnel'
    })
    .options('tunnel-ssl-key', {
        describe: 'the ssl key for encrypting the tunnel'
    })
    .options('tunnel-ssl-ca', {
        describe: 'the certificate authority chain for the ssl cert that is used to encrypt the tunnel'
    })
    .argv;

if (argv.help) {
    optimist.showHelp();
    process.exit();
}

const server = CreateServer({
    max_tcp_sockets: argv['max-sockets'],
    secure: argv.secure,
    domain: argv.domain,
    key: argv['tunnel-ssl-key'],
    cert: argv['tunnel-ssl-cert'],
    ca: argv['tunnel-ssl-ca']
});

server.listen(argv.port, argv.address, () => {
    debug('server listening on port: %d', server.address().port);
});

process.on('SIGINT', () => {
    process.exit();
});

process.on('SIGTERM', () => {
    process.exit();
});

process.on('uncaughtException', (err) => {
    log.error(err);
});

process.on('unhandledRejection', (reason, promise) => {
    log.error(reason);
});

// vim: ft=javascript

