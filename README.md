![kcapp logo](https://raw.githubusercontent.com/kcapp/frontend/master/public/images/logo.png)

# sio-client
[socket io](https://socket.io/) client for consuming live events from [kcapp](https://github.com/kcapp/frontend)


## Usage
```javascript
var kcapp = require('kcapp-sio-client/kcapp')("<server ip>", <server port>);
kcapp.connect(() => {
  kcapp.on('new_match', (data) => {
    // New match started
  });
  // Additional callbacks ...
});
```
