import { hri } from 'human-readable-ids';
import Debug from 'debug';

import Client from './Client.js';
import TunnelAgent from './TunnelAgent.js';

// Manage sets of clients
//
// A client is a "user session" established to service a remote localtunnel client
class ClientManager {
    constructor(opt) {
        this.opt = opt || {};

        // id -> client instance
        this.clients = new Map();

        // statistics
        this.stats = {
            tunnels: 0
        };

        this.debug = Debug('mytunnel:ClientManager');
    }

    // create a new tunnel with `id`
    // if the id is already used, a random id is assigned
    // if the tunnel could not be created, throws an error
    async newClient(id) {
        // can't ask for id already is use
        if (this.clients[id]) {
            id = hri.random();
        }

        const maxSockets = this.opt.max_tcp_sockets;
        const agent = new TunnelAgent({
            clientId: id,
            maxSockets: 10,
            key: this.opt.key,
            cert: this.opt.cert,
            ca: this.opt.ca
        });

        const client = new Client({
            id,
            agent,
        });

        // add to clients map immediately
        // avoiding races with other clients requesting same id
        this.clients[id] = client;

        client.once('close', () => {
            this.removeClient(id);
        });

        // try/catch used here to remove client id
        try {
            const info = await agent.listen();
            ++this.stats.tunnels;
            return {
                id: id,
                port: info.port,
                isTls: this.opt.cert ? true: false,
                OverrideTunnelIp: this.opt.OverrideTunnelIp,
                certificate: this.opt.cert,
                max_conn_count: maxSockets,
            };
        }
        catch (err) {
            this.removeClient(id);
            // rethrow error for upstream to handle
            throw err;
        }
    }

    getClients() {
        return Object.keys(this.clients);
    }

    removeClient(id) {
        this.debug('removing client: %s', id);
        const client = this.clients[id];
        if (!client) {
            return;
        }
        --this.stats.tunnels;
        delete this.clients[id];
        client.close();
    }

    hasClient(id) {
        return !!this.clients[id];
    }

    getClient(id) {
        return this.clients[id];
    }
}

export default ClientManager;
