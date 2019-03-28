var debug = require('debug')('kcapp-sio-client:leg-handler');
var io = require("socket.io-client");

var DART_MISS = { value: 0, multiplier: 1 };

/**
 * Handle a connected event
 * @param {object} data
 */
function onConnected(data) {
    onScoreUpdate.bind(this)(data);
    debug(`Connected to /legs/${this.id}`);
    this.connectCallback(this);
}

/**
 * Handle a score_update event
 * @param {object} data - Data
 */
function onScoreUpdate(data) {
    var players = data.players;
    for (var i = 0; i < players.length; i++) {
        var player = players[i];
        if (player.player_id === data.leg.current_player_id) {
            this.currentPlayer = player;
        }
    }
    this.leg = data.leg;
    this.players = players;

    // Reset variables keeping track of throws
    this.throws = [];
    this.dartsThrown = 0;
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
 * Emit a throw, indicating that the given dart was just thrown
 *
 * @param {object} dart - Dart thrown
 */
exports.emitThrow = (dart,) => {
    this.dartsThrown++;
    this.throws.push(dart);

    var payload = {
        current_player_id: this.currentPlayer.player_id,
        score: dart.score,
        multiplier: dart.multiplier,
        darts_thrown: this.dartsThrown,
        is_undo: false
    }
    this.socket.emit('possible_throw', payload);
    // TODO Auto throw after 3 darts?
}

/**
 * Emit a throw, indicating that the given dart was just thrown
 *
 * @param {object} dart - Dart thrown
 */
exports.undoThrow = (dart) => {
    if (isUndo) {
        this.dartsThrown--;
        this.throws.splice(-1, 1);
    } else {
        this.dartsThrown++;
        this.throws.push(dart);
    }
    var payload = {
        current_player_id: this.currentPlayer.player_id,
        score: dart.score,
        multiplier: dart.multiplier,
        darts_thrown: this.dartsThrown,
        is_undo: true
    }
    this.socket.emit('possible_throw', payload);
}

/**
 * Emit a visit, this will confirm the visit, and write all values to database
 */
exports.emitVisit = () => {
    var payload = {
        player_id: this.currentPlayer.player_id,
        leg_id: this.id,
        first_dart: DART_MISS,
        second_dart: DART_MISS,
        third_dart: DART_MISS
    };

    if (this.throws[0]) {
        var first = this.throws[0];
        payload.first_dart = { value: first.score, multiplier: first.multiplier };
    }
    if (this.throws[1]) {
        var second = this.throws[1];
        payload.second_dart = { value: second.score, multiplier: second.multiplier };
    }
    if (this.throws[2]) {
        var third = this.throws[2];
        payload.third_dart = { value: third.score, multiplier: third.multiplier };
    }
    this.socket.emit('throw', JSON.stringify(payload));
}

/**
 * Connect to namespace of the given leg
 * @param {int} id - Leg ID
 */
exports.connect = (id, callback) => {
    this.id = id;
    this.connectCallback = callback;
    this.socket = io(`${this.baseURL}/legs/${id}`);

    // Update leg, players, etc when score is updated
    this.socket.on('connect', (data) => {
        this.socket.emit('join', 'Client Connecting');
    });
    this.socket.on('connected', onConnected.bind(this));
    this.socket.on('score_update', onScoreUpdate.bind(this));
    return this;
}

/**
 * Disconnect from the socket
 */
exports.disconnect = () => {
    this.socket.disconnect();
    debug(`Disconnected from "${this.socket.nsp}"`);
}

/**
 * Configure the leg-handler
 * @param {string} baseURL - BaseURL of socket.io endpoint
 */
module.exports = (baseURL) => {
    this.baseURL = baseURL;
    return this;
}