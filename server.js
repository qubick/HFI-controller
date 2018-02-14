var express = require("express");
var app = express();
var fs = require("fs");
var http = require("http");
var reqIdx = 0;

var SerialPort = require("serialport");
var port;

//server main page
app.get("/", (req, res) => {
	res.sendfile('index.html')
});

app.post("/", function(req, res){
	console.log("POST message recieved from the app")
	console.log(req.body);
	// res.send(200); //no response w/ ('ok') message
	res.sendfile('index.html'); //refresh screen
	
	sendCommand();
})

app.listen(5555, () => {
	console.log("HFI controller app listening on port 5555");
	port = new SerialPort('/dev/cu.usbmodem1411', {
		baudRate: 57600
	});
	
	if(port){
		console.log("serial port opened to the printer");
		// port.write('M109 S250.000000\n'); //set temperature and wait until reach for the next command
		port.write('G0 X0 Y0 Z10 F1800\n'); //home all axis
		port.write('G0 X30 Y50 F1800\n'); //text move
		port.write('G0 Y30\n'); //step by step
	}
	else {
		console.log("failed to open port")
	}
});

app.post("/user/add", function(req, res){
	res.send("OR");
});

app.get(/^(.+)$/, function(req, res){
	console.log('static file requre: ' + req.params);
	res.sendFile(__dirname + req.params[0]);
});

function sendCommand(){
	console.log("start sending commands...");
}