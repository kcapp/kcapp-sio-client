var debug = require('debug')('kcapp-sio-client:leg-handler');
var io = require("socket.io-client");

var DART_MISS = { score: 0, multiplier: 1 };

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
 * Handle possible throw event
 * @param {object} data - Data
 */
function onPossibleThrow(data) {
    if (data.origin === this.origin) {
        // We don't need to handle updates from ourselves
        return;
    }

    if (data.is_undo) {
        this.dartsThrown--;
        this.throws.splice(-1, 1);
    } else {
        this.throws.push({ score: data.score, multiplier: data.multiplier });
        this.dartsThrown++;
    }
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
 * Emit the given event, with given data
 * @param {string} - Socket IO event to emit
 * @param {object} - Data to emit with event
 */
exports.emit = (event, data) => {
    this.socket.emit(event, JSON.stringify(data));
}

/**
 * Emit a throw, indicating that the given dart was just thrown
 *
 * @param {object} dart - Dart thrown
 */
exports.emitThrow = (dart) => {
    this.dartsThrown++;
    this.throws.push(dart);

    var payload = {
        current_player_id: this.currentPlayer.player_id,
        score: dart.score,
        multiplier: dart.multiplier,
        darts_thrown: this.dartsThrown,
        origin: this.origin,
        is_undo: false
    }
    this.socket.emit('possible_throw', payload);
    //this.currentPlayer.current_score -= dart.score * dart.multiplier;
    // TODO Auto throw after 3 darts?
}

/**
 * Emit a throw, indicating that the given dart was just thrown
 *
 * @param {object} dart - Dart thrown
 */
exports.undoThrow = (dart) => {
    this.dartsThrown--;
    this.throws.splice(-1, 1);

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
    if (this.dartsThrown < 3) {
        for (var i = this.dartsThrown; i < 3; i++) {
            this.emitThrow(DART_MISS);
        }
    }

    var payload = {
        player_id: this.currentPlayer.player_id,
        leg_id: this.id,
        first_dart: { value: this.throws[0].score, multiplier: this.throws[0].multiplier },
        second_dart: { value: this.throws[1].score, multiplier: this.throws[1].multiplier },
        third_dart: { value: this.throws[2].score, multiplier: this.throws[2].multiplier }
    };
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
    this.socket.on('possible_throw', onPossibleThrow.bind(this));
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
 * @param {string} origin - Origin of events to send when emitting throws
 */
module.exports = (baseURL, origin) => {
    this.baseURL = baseURL;
    this.origin = origin;
    return this;
}