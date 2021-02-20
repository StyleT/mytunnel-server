
import WebSocket from 'ws';

export default class WsServer {
    #wss;
    #clientManager;

    constructor(clientManager) {
        this.#wss = new WebSocket.Server({ noServer: true });
        this.#clientManager = clientManager;

        this.#wss.on('connection', this.#onWsConnection);
    }

    #onWsConnection = async (ws, request) => { //TODO: proper err handling for Promise errs
        console.log(request);
        ws.on('message', function incoming(message) {
            console.log('received: %s', message);
        });

        const info = await this.#clientManager.newClient(); //TODO: here we should have smthng like "newWsClient" and ClientWs class for Ws clients

        info.url = 'http://' + info.id + '.' + request.host; //TODO: rm schema hardcode

        ws.send(JSON.stringify(info)); //TODO: Here we should only reply "ok"
    }

    handleUpgrade(request, socket, head) {
        this.#wss.handleUpgrade(request, socket, head, (ws) => {
            this.#wss.emit('connection', ws, request);
        });
    }
}