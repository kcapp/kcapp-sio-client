var debug = require('debug')('kcapp-sio-client:client');
var io = require("socket.io-client");

exports.DART_REIDAR_VENUE_ID = 4;

/**
 * Handle the leg_finished event, by setting up, and connecting to
 * the namespace for the next leg
 * @param {object} data - Data emitted when leg is finished
 */
function onNewLegStarted(data) {
    debug(`Leg ${data.leg.id} finished. Joining next leg ${data.match.current_leg_id}`);
    this.connectLegNamespace(data.match.current_leg_id, this.legConnectedCallback);
}

/**
 * Register a callback for the given event
 * @param {string} event - Socket IO Event to register callback for
 * @param {function} callback - Callback when event is emitted
 */
exports.on = (event, callback) => {
    this.socket.on(event, callback);
}

/**
 * Connect to the namespace for the given leg
 * @param {int} id - Leg ID
 */
exports.connectLegNamespace = (id, callback) => {
    var leg = this.legHandler.connect(id, callback);
    leg.socket.on('new_leg', onNewLegStarted.bind(this));
    this.legs[id] = leg;
    this.legConnectedCallback = callback;
}

/**
 * Connect to the socket
 */
exports.connect = (callback) => {
    this.socket = io(`${this.baseURL}/active`);
    this.socket.on('connect', (data) => {
        if (this.connected) {
            debug("Already connected to /active");
            return;
        }
        debug(`Connected to namespace "${this.socket.nsp}" on "${this.baseURL}"`)
        this.connected = true;
        callback(data);
    });
}
/**
 * Disconnect from the socket
 */
exports.disconnect = () => {
    this.socket.disconnect();
	this.connected = false;
    debug(`Disconnected from "${this.socket.nsp}"`);
}

/**
 * Configure the kcapp module
 * @param {string} ip - IP of socket.io endpoint
 * @param {int} port - Port of socket.io endpoint
 * @param {string} origin - Origin of events to send when emitting throws
 * @param {string} scheme - Scheme
 */
module.exports = (ip, port, origin = 'kcapp-sio-client', scheme = 'https') => {
    this.origin = origin;
    this.baseURL = `${scheme}://${ip}:${port}`;
    debug(`Using base URL ${this.baseURL}`);
    this.legHandler = require('./leg-handler')(this.baseURL, this.origin);
    this.legs = {};
    return this;
};
