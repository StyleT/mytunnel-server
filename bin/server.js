#!/usr/bin/env node

import 'localenv';
import optimist from 'optimist';

import log from 'book';
import Debug from 'debug';
import pemPromise from 'pem-promise';
import CreateServer from '../server.js';
import fs from 'fs';
import axios from 'axios';
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
    .options('enable-tunnel-ssl', {
        describe: 'tells the tunnel to enable SSL'
    })
    .options('web-cert', {
        describe: 'the ssl cert for the main web page'
    })
    .options('web-key', {
        describe: 'the ssl key for the main web page'
    })
    .options('web-ca', {
        describe: 'the ssl ca for the main web page'
    })
    .options('auto-generate-cert', {
        describe: 'enabling this flag will automatically generate the server certs for you'
    })
    .options('override-tunnel-ip', {
        describe: 'override the ip to connect to when establishing sockets, usually meant to be used if you are using a external load balancer'
    })
    .options('auto-discover-tunnel-ip', {
        describe: 'automatically descover the tunnel public ip via the AWS checkip endpoint'
    })
    .argv;

if (argv.help) {
    optimist.showHelp();
    process.exit();
}
if (!argv['auto-generate-cert'] && argv['enable-tunnel-ssl']) {
    argv['tunnel-ssl-key'] = fs.readFileSync(argv['tunnel-ssl-key'])
    argv['tunnel-ssl-cert'] = fs.readFileSync(argv['tunnel-ssl-cert'])
    argv['tunnel-ssl-ca'] = fs.readFileSync(argv['tunnel-ssl-ca'])
}
if (argv['auto-generate-cert']) {
    await pemPromise.createCertificate().then((keys) => {
            argv['tunnel-ssl-key'] = keys.serviceKey
            argv['tunnel-ssl-cert'] = keys.certificate
            argv['tunnel-ssl-ca'] = keys.certificate
        }
    );

}
if (argv['auto-discover-tunnel-ip']) {
    await axios.get("http://checkip.amazonaws.com")
        .then((response) => {
            argv['override-tunnel-ip'] = response.data.split("\n")[0]
        })
}
const server = CreateServer({
    max_tcp_sockets: argv['max-sockets'],
    secure: argv.secure,
    domain: argv.domain,
    key: argv['tunnel-ssl-key'],
    cert: argv['tunnel-ssl-cert'],
    ca: argv['tunnel-ssl-ca'],
    webcert: argv['web-cert'],
    webkey: argv['web-key'],
    webca: argv['web-ca'],
    OverrideTunnelIp: argv['override-tunnel-ip']
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

