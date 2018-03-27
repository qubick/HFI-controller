//server console message color scheme: Magenta

//gcode is sent to the printer in two case:
//		1. file is opened by client's request to open file
//		2. stl file is created by any hand drawn sketches

var express = require("express");
var app = express();
var fs = require("fs");
var http = require("http");
var exec = require('child_process').execSync, child1, child2; //ensure asynchronous
var colors = require('colors');
var sync = require('synchronize');

//for serial connection with the printer
var SerialPort = require("serialport");
var port;
var ackMsgFrom3DP = '';

//for message channel with the client
var pendingResponses = {};
var clientQueues = {};
var reqIdx = 0;
var printerBehavior = '' //this should be gloabl so can be checked all the time

// for gcodemovments
var parser		= require('./libs/parseGcode.js');
var transform	= require('./libs/transformLayer.js');
var gcodeFilename = ''; //will load filename when file opened from the client
var queue			= require('./libs/queue.js');
var gcodeQueue = new queue.Queue();
var currGcodeLineIdx = 0; //this is the latest gcode line

var leapMotion = require('./libs/leapMotion.js');

//server main page
app.get("/", (req, res) => {
	res.sendfile('index.html')
});

app.listen(5555, () => {
	console.log('[Server]'.magenta, ' HFI controller app listening on port 5555');

	// create connection with the 3D printer
	port = new SerialPort('/dev/cu.usbmodem1411', {
		baudRate: 57600
	});

	//create connection with the leapMotion
	leapMotion.leapMotion();

	if(port){
		console.log('[Server]'.magenta, 'Serial:USB1411 opened to the 3D printer');
		port.write('G28 F1800 X Y Z \n', (err) => { //home all axis, test move
			if (err) return console.log("Error on initiating the port")
		});

		port.on('readable', ()=>{
			ackMsgFrom3DP = port.read().toString('utf8'); //data.toString("utf8"); //this should get ok message
			console.log('[Server]'.magenta, "Printer ACK: ", ackMsgFrom3DP);
		})

		exports.port = port; //export when port is created
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
});

app.get(/^(.+)$/, (req, res) => {
	console.log('static file requre: ' + req.params);
	res.sendFile(__dirname + req.params[0]);
});


//create a semparate message between server ~ client
http.createServer((req, res) => {

	var parts = req.url.split("/");
	var clientId = parts[2];
	res.setHeader("Access-Control-Allow-Origin", "*");

	if (parts[1] === "register") {
		clientQueues[clientId] = [];

	}

	else if (parts[1] === "ctos") { //recieve msg from the remote user/ar-user app
		var body = JSON.parse(decodeURIComponent(parts[3]));//, 'base64').toString('binary');
		console.log(body.commands);
		printerBehavior = body.commands.msg;

		if(body.channelId === "general"){
			console.log('[Server]'.magenta, "curr printer behavior: ", printerBehavior)

			if(printerBehavior === "start"){
				console.log('[Server]'.magenta, "Start: run cmd sender queue");
				let content;

				fs.readFile(gcodeFilename, "utf8", function read(err, data){
					if(err) throw err;
					content = data;
					let gcodes = data.split('\n');

					parser.parseGcode(gcodes, ()=>{

						//when gcodes is done for parsing;
						console.log('[Server]'.magenta, 'gcodeSegments length: ', parser.gcodeSegments.length);
						SendCommand();
					});

					//apply transformation matrix if there is any intervention for desgin
					var transformType = "rotate";
					transform.ApplyTransformation(transformType);
				});
			}
			else if(printerBehavior === "directGcode"){

				let gcodeLine = body.commands.content;
				console.log('[Server]'.magenta, "Send Gcode: ", gcodeLine);
				port.write(gcodeLine + '\n');
			}
			else if(printerBehavior === "printing"){
				console.log('[Server]'.magenta, "Printing: restore paused position && resume sending queue")
				SendCommand(); //resume sendcommand again, but it will start to send from the latest line of gcode
			}
			else if(printerBehavior === "paused"){
				console.log('[Server]'.magenta, "Paused: store curr position && home x y axis ")
				// port.write("G28 X Y\n"); //example: home all axis
				port.write("M226\n"); //pause
			}
			else if(printerBehavior === "openFile"){
				console.log('[Server]'.magenta, 'OpenFile: open the gcode/stl file ', body.commands.filename, ' to interpret gcode');
				gcodeFilename = './assets/' + body.commands.filename;

				// if(gcodeFilename.match())
				//if stl -> call cura go get test.gcode
			}
			else if(printerBehavior === "createGcode"){ //create a openjscad file from geometry,
				var line = body.commands.script;

				fs.writeFile('./output/output.jscad', line, (err)=>{
					if(err) return console.log(err);

					let cmd1 = 'openjscad output/output.jscad';
					let cmd2 = './CuraEngine/build/CuraEngine slice'
									+ ' -j ./CuraEngine/resources/definitions/printrbot_play.def.json '
									+ ' -e0 -l "output/output.stl" -o "output/output.gcode"'
									+ ' -s model_position_z="500"' //set to large values, so area below the model will be removed when slicing
									+ ' -s layer_height_0="0.25"'
									+ ' -s brim_line_count="10"'
									+ ' -s wall_line_width_x="0.4"'

					// slicer settings for later
					// cmd2 += '-s default_material_print_temperature="230" -s material_print_temperature="230" material_print_temperature_layer_0="215" ' //temp settings
					// cmd2 += '-s speed_print_layer_0="10" -s speed_wall_x="10" -s speed_topbottom="30"'

					RunShellCommands(cmd1, cmd2);
				});
			}
		} // if channel's channel ID = general

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

	}
	else if (parts[0] === "stoc") { //initiate server connection
		if(res.setHeader("Cache-Control", "no-cache"))

		if(clientQueues){
			var item = clientQueues[clientId].shift();
			if(item) res.end(item);
			else pendingResponses[clientId] = res;
		}
	} else {
		res.setHeader("Content-Type", "text/html");
	}
}).listen(5000, () => { //createServer();
	console.log('[Server]'.magenta, 'The HTTP message channel is listening on 5000'.white);
});

async function SendCommand(){
	console.log('[Server]'.magenta, "Will send gcode from line: ", currGcodeLineIdx);

	var gcodesTo3DP = parser.gcodeSegments;

	// fs.writeFile('interpolatedPoints.gcode', gcodesTo3DP.join(','));
	for(let cnt=currGcodeLineIdx; cnt<gcodesTo3DP.length; cnt++){

		if(printerBehavior === "paused"){ //always check if this is true << should this be an interrupt??
			console.log("will stop the machine");
			port.write("G28 X Y\n", (err)=>{
				// do something with triggered design interaction
			});

			currGcodeLineIdx = cnt;
			console.log("will stop to send gcdoe at: ", cnt);
			break;
		}
		else {
			await WriteGcodeTo3DP(gcodesTo3DP[cnt]);
		}
	}
}

function WriteGcodeTo3DP(cmd){
	// var ack;
	return new Promise((resolve, reject)=>{
		console.log('[Server]'.magenta, "In send() func, sending cmd: ", cmd);

		port.on('readable', () => { //polling
		   var ret = ''
		   while (ret != 'ok'){
				 ret = port.read(); //it returns null immediately
				 console.log('[Server]'.magenta, "In polling loop, printer msg: ", ret);
				 delay(10);
			 }
		});

		port.write(cmd, resolve);
	});
}

var delay = ( () => {
    var timer = 0;
    return function(callback, ms) {
        clearTimeout (timer);
        timer = setTimeout(callback, ms);
    };
})();

function RunShellCommands(cmd1, cmd2){

	console.log("[Server]".magenta, "run openjscand to generate STL from polygons")
	child1 = exec(cmd1, (err, stdout, stderr)=>{
		// console.log('running openjscad script, stdout: '.blue + stdout);

		if(err) console.log("exec error from running openjscad script: ".blue, err);
		if(stderr) console.log('\n[Server]'.magenta, strerr.red);
	});

	//once the 1st cmd (run openjscad) done
	console.log("[Server]".magenta, "run curaengine to generate gcode..")
	child2 = exec(cmd2, (err, stdout, stderr)=>{
		// console.log('running slicer, stdout: '.blue + stdout);

		if(err) console.log('exec error from running slicer: '.blue, err);
		if(stderr) console.log('\n[Server]'.magenta, strerr.red);
	});

	//once the 2nd cmd (run curaEngine) done, read gcode file and send to the printer queue
	// if(child2) //as exec is execSync
	fs.readFile("output/output.gcode", "utf8", (err, data) => {
		if(err) throw err;

		var gcodes = data.split('\n');

		parser.parseGcode(gcodes, ()=>{
			console.log('[Server]'.magenta, 'finish parsing gcodes from sketch generation')
			console.log('[Server]'.magenta, 'gcodeSegments length: ', parser.gcodeSegments.length);

			SendCommand();
		}); //parseGcode
	}); //EOF readfile
}
