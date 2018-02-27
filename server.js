//server console message color scheme: Magenta

var express = require("express");
var app = express();
var fs = require("fs");
var http = require("http");
var exec = require('child_process').execSync, child; //ensure asynchronous
var colors = require('colors');

//for serial connection with the printer
var SerialPort = require("serialport");
var port = new SerialPort('/dev/cu.usbmodem1411', {
	baudRate: 57600
});

//for message channel with the client
var pendingResponses = {};
var clientQueues = {};
var reqIdx = 0;

// for gcodemovments
var gcodeCommandsToPrinter;
var queue = require('./queue.js');
var gcodeQueue = new queue.Queue();

var leapMotion = require('./leapMotion.js');

//server main page
app.get("/", (req, res) => {
	res.sendfile('index.html')
});

app.listen(5555, () => {
	console.log('[Server]'.magenta, ' HFI controller app listening on port 5555'.white);

	//create connection with the 3D printer
	// port = new SerialPort('/dev/cu.usbmodem1411', {
	// 	baudRate: 57600
	// });

	//create connection with the leapMotion
	leapMotion.leapMotion();

	if(port){
		console.log('[Server]'.magenta, 'Serial port to the 3D printer opened'.white);
		// port.write('M109 S250.000000\n'); //set temperature and wait until reach for the next command
		port.write('G0 F3600 X30 Y50 \n'); //test move
		port.write('G0 Y30\n'); //step by step
		port.write('G28 F1800 X Y Z \n'); //home all axis

		// while (!gcodeQueue.isEmpty){
		// 	var line = gcodeQueue.pop();
		// 	port.write(line);
		// }

	}
	else {
		console.log('[Server]'.magenta, "failed to open port".red)
	}
});

//for start printing, will replace this with message channel
app.post('/', (req, res) => {
	console.log("POST message recieved from the app")
	// res.send(200); //no response w/ ('ok') message
	res.sendfile('index.html'); //refresh screen

	sendCommand();
});

app.get(/^(.+)$/, (req, res) => {
	console.log('static file requre: ' + req.params);
	res.sendFile(__dirname + req.params[0]);
});

http.createServer((req, res) => {

	var parts = req.url.split("/");
	var clientId = parts[2];
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (parts[1] == "register") {
    clientQueues[clientId] = [];

  } else if (parts[1] == "ctos") { //recieve msg from the remote user/ar-user app
		var body = JSON.parse(decodeURIComponent(parts[3]));//, 'base64').toString('binary');
		console.log(body.commands);
		var printerBehavior = body.commands.msg;

		if(body.channelId === "general"){
			console.log("curr printer behavior: ", printerBehavior)
			if(printerBehavior === "start"){
				console.log('[Server]'.magenta, "run cmd sender queue");

				var content;
				var filename = './assets/' + body.commands.file;

				fs.readFile(filename, "utf8", function read(err, data){
					if(err) throw err;
					content = data;
					gcodeCommandsToPrinter = content.split('\n');
				});

			}
			else if(printerBehavior === "printing"){
				console.log('[Server]'.magenta, "restore paused position && resume sending queue")
				// port.write("G0 X10 F1800\n"); //example pos to return back
				// port.write("G0 Y10\n");
			}
			else if(printerBehavior === "paused"){
				console.log('[Server]'.magenta, "store curr position && home all axis ")
				// port.write("G28 X Y Z\n"); //example: home all axis
			}

			else if(printerBehavior === "writeFile"){ //create a openjscad file from geometry,
				var line = body.commands.script;

				fs.writeFile('./output/output.jscad', line, (err)=>{
				  if(err) return console.log(err);

					let cmd1 = 'openjscad output/output.jscad';
					let cmd2 = './CuraEngine/build/CuraEngine slice -j ./CuraEngine/resources/definitions/printrbot_play.def.json -e0 -l "output/output.stl" -o "output/test.gcode"'

					// slicer settings for later
					// cmd2 += '-s default_material_print_temperature="230" -s material_print_temperature="230" material_print_temperature_layer_0="215" ' //temp settings
					// cmd2 += '-s speed_print_layer_0="10" -s speed_wall_x="10" -s speed_topbottom="30"'

					runCommandline(cmd1, cmd2);

				});

			}
		}

		Object.keys(clientQueues).forEach((otherClientId) => {
        if (otherClientId != clientId) {
          if (pendingResponses[otherClientId]) {
            pendingResponses[otherClientId].end(body);
            pendingResponses[otherClientId] = null;
          } else
            clientQueues[otherClientId].push(body);
        }
      });

    res.end();
  }	else if (parts[0] == "stoc") { //initiate server connection
		if(res.setHeader("Cache-Control", "no-cache"))

		if(clientQueues){

			var item = clientQueues[clientId].shift();
	    if (item)
	      res.end(item);
	    else
	      pendingResponses[clientId] = res;
		}
  } else {
    res.setHeader("Content-Type", "text/html");
  }
}).listen(5000, () => {
	console.log('[Server]'.magenta, 'The HTTP message channel is listening on 5000'.white);
});

//listening msg from app
// var channel = new Channel("general");
// channel.onmessage = function(evt){
// 	var coord = evt.data;
// 	console.log("msg recieved from app: ", coord);
// }

function sendCommand(){
	console.log("start sending commands...");

	// 1. create a Queue if not defined;
	// 2. queue will send cmd to printer if queue is not empty
	// 3. send cmd to the queue step by step
	// 4. wait if the queue is full
}


function runCommandline(cmd1, cmd2){

	console.log("\n[Server]".magenta, "run openjscand && curaengine to generate gcode..")

	child = exec(cmd1, (err, stdout, stderr)=>{
		// console.log('running openjscad script, stdout: '.blue + stdout);

		if(err) console.log("exec error from running openjscad script: ".blue, err);
		if(stderr) console.log('\n[Server]'.magenta, strerr.red);
	});

	//once the 1st cmd (run openjscad) done
	child = exec(cmd2, (err, stdout, stderr)=>{
		// console.log('running slicer, stdout: '.blue + stdout);

		if(err) console.log('exec error from running slicer: '.blue, err);
		if(stderr) console.log('\n[Server]'.magenta, strerr.red);
	});

	//once the 2nd cmd (run cura engine)
	fs.readFile("output/test.gcode", "utf8", (err, data) => {
		if(err) throw err;

		// console.log(data.blue);
		var gcodes = data.split('\n');
		gcodes.forEach((gcodeline) =>{
			// console.log("writing gcode: ".blue, gcodeline);
			port.write(gcodeline + '\n'); //send gcode line by line
		});

	});
}
