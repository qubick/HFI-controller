//message channel to send msg to server w/o POST message
// var channelURL = "http://" + serverIP + ":" + messagePort;
var channelURL = "http://localhost:5000"; //for now

function ServerConnection() {
    var _this = this;
    var clientId = Math.random().toString(16).substr(2);

    function longPoll() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", channelURL + "/stoc/" + clientId);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                if (_this.onmessage)
                    _this.onmessage({ "type": "message", "data": xhr.responseText });
                setTimeout(longPoll, 0);
            }
        };
        xhr.send();
    }

    function register() {
        var xhr = new XMLHttpRequest();
        try {
          xhr.open("GET", channelURL + "/register/" + clientId);
        } catch (e){
          console.log("*****error creating server request: " + e)
        }
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                setTimeout(longPoll, 0);
            }
        };
        xhr.send();
    }

    register();

    var sendQueue = [];
    function processSendQueue() {
        var item = sendQueue.shift();
        if (!item)
            return;

        var xhr = new XMLHttpRequest();
        xhr.open("GET", channelURL + "/ctos/" + clientId + '/' + encodeURIComponent(item));
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200){
              setTimeout(processSendQueue, 0);
            }
        }
        xhr.send();
    }

    this.postMessage = function (message) {
        if (sendQueue.push(message) == 1){
            processSendQueue();
        }
    };

    this.onmessage = null;
}

function Channel(channelId) {
    if (!Channel._channels)
        Channel._channels = {}; //initiate channel
    Channel._channels[channelId] = this;

    if (!Channel._serverConnection) {
        Channel._serverConnection = new ServerConnection();
        Channel._serverConnection.onmessage = function (evt) {
            var info = JSON.parse(evt.data);

            // console.log("evt: ", evt.data);

            var channel = Channel._channels[info.channelId];
            if (channel && channel.onmessage)
                channel.onmessage({ "type": "message", "data": info.message });
        };
    }

    this.postMessage = function(commands) {
        Channel._serverConnection.postMessage(JSON.stringify({ "channelId": channelId, "commands": commands}));
    };

    this.onmessage = null;
}
