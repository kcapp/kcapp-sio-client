var debug = require('debug')('kcapp:client');
var io = require("socket.io-client");

exports.DART_REIDAR_VENUE_ID = 4;

/**
 * Handle the leg_finished event, by setting up, and connecting to
 * the namespace for the next leg
 * @param {object} data - Data emitted when leg is finished
 */
function onLegFinished(data) {
    debug(`Leg ${data.old_leg_id} finished, setting up new namespace ${data.new_leg_id}`);
    this.connectLegNamespace(data.new_leg_id, this.legConnectedCallback);
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
    leg.socket.on('leg_finished', onLegFinished.bind(this));
    this.legs[id] = leg;
    this.legConnectedCallback = callback;
}

/**
 * Connect to the socket
 */
exports.connect = (callback) => {
    this.socket = io(`${this.baseURL}/active`);
    this.socket.on('connect', (data) => {
        debug(`Connected to namespace "${this.socket.nsp}" on "${this.baseURL}"`)
        callback(data);
    });
}

/**
 * Disconnect from the socket
 */
exports.disconnect = () => {
    this.socket.disconnect();
    debug(`Disconnected from "${this.socket.nsp}"`);
}

/**
 * Configure the kcapp module
 * @param {string} ip - IP of socket.io endpoint
 * @param {int} port = Port of socket.io endpoint
 */
module.exports = (ip, port) => {
    this.baseURL = `http://${ip}:${port}`;
    this.legHandler = require('./leg-handler')(this.baseURL);
    this.legs = {};
    return this;
};