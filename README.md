![kcapp logo](https://raw.githubusercontent.com/wiki/kcapp/frontend/images/logo/kcapp_plus_socketio.png)

# kcapp-sio-client
[socket io](https://socket.io/) client for consuming events for live matches in [kcapp](https://github.com/kcapp/frontend)

## Usage
By default when connecting to `kcapp` you will be subscribed to the `/active` namespace which contains global events about matches startec etc.


```javascript
// Create client
const kcapp = require('kcapp-sio-client/kcapp')("<server ip>", <server port> /*, <useragent>, <scheme> */);

// Connect to '/active' namespace
kcapp.connect(() => {
  kcapp.on('new_match', (data) => {
    // New match started
  });
  // Additional callbacks for other events ...
});
```
### Connecting to a specific leg
```javascript
kcapp.connectLegNamespace(legId, (socket) => {
    socket.on('score_update', (data) => {
      // Handle score updates
    });

    socket.on('leg_finished', (data) => {
      // Handle leg finished
    });

    socket.on('cancelled', (data) => {
      // Handle leg cancelled
    });
});
```