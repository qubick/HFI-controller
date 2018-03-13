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

//for serial connection with the printer
var SerialPort = require("serialport");
var port;

//for message channel with the client
var pendingResponses = {};
var clientQueues = {};
var reqIdx = 0;
var printerBehavior = '' //this should be gloabl so can be checked all the time

// for gcodemovments
var parser = require('./libs/parseGcode.js');
// var gcodeCommandsToPrinter;
var queue = require('./libs/queue.js');
var gcodeQueue = new queue.Queue();
var currGcodeLineIdx = 0; //this is the latest gcode line

var leapMotion = require('./libs/leapMotion.js');

//server main page
app.get("/", (req, res) => {
	res.sendfile('index.html')
});

app.listen(5555, () => {
	console.log('[Server]'.magenta, ' HFI controller app listening on port 5555'.white);

	// create connection with the 3D printer
	port = new SerialPort('/dev/cu.usbmodem1411', {
		baudRate: 57600
	});

	//create connection with the leapMotion
	leapMotion.leapMotion();

	if(port){
		console.log('[Server]'.magenta, 'USB1411 opened to the 3D printer'.white);
		port.write('G28 F1800 X Y Z \n'); //home all axis, test move

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
			}
			else if(printerBehavior === "printing"){
				console.log('[Server]'.magenta, "Printing: restore paused position && resume sending queue")
				// port.write("G0 X10 F1800\n"); //example pos to return back
				// port.write("G0 Y10\n");
			}
			else if(printerBehavior === "paused"){
				console.log('[Server]'.magenta, "Paused: store curr position && home all axis ")
				port.write("G28 X Y Z\n"); //example: home all axis
			}
			else if(printerBehavior === "openFile"){
				console.log('[Server]'.magenta, 'OpenFile: open the gcode/stl file ', body.commands.filename, ' to interpret gcode');

				var content;
				var filename = './assets/' + body.commands.filename;

				fs.readFile(filename, "utf8", function read(err, data){
					if(err) throw err;
					content = data;
					var gcodes = data.split('\n');

					parser.parseGcode(gcodes, ()=>{

						//when gcodes is done for parsing;
						console.log('[Sever]'.magenta, 'gcodeSegments length: ', parser.gcodeSegments.length);
						sendCommand();
					}); //parseGcode
				});
			}
			else if(printerBehavior === "createGcode"){ //create a openjscad file from geometry,
				var line = body.commands.script;

				fs.writeFile('./output/output.jscad', line, (err)=>{
				  if(err) return console.log(err);

					let cmd1 = 'openjscad output/output.jscad';
					let cmd2 = './CuraEngine/build/CuraEngine slice'
										+ ' -j ./CuraEngine/resources/definitions/printrbot_play.def.json '
										+ ' -e0 -l "output/output.stl" -o "output/output.gcode"'
										+ ' -s layer_height_0="0.25"'
										+ ' -s brim_line_count="10"'
										+ ' -s wall_line_width_x="0.4"'

					// slicer settings for later
					// cmd2 += '-s default_material_print_temperature="230" -s material_print_temperature="230" material_print_temperature_layer_0="215" ' //temp settings
					// cmd2 += '-s speed_print_layer_0="10" -s speed_wall_x="10" -s speed_topbottom="30"'

					runShellCommands(cmd1, cmd2);
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

function sendCommand(){
	console.log("start sending commands...");

	// 1. create a Queue if not defined;
	// if(gcdoeQueue === undefined){
	// 	 gcodeQueue = new queue.Queue();
	// }
	// 2. read existing gcode file >> save in the queue
	var gcodesTo3DP = parser.gcodeSegments;
	for(let cnt=currGcodeLineIdx; cnt<gcodesTo3DP.length; cnt++){

		if(printerBehavior === "paused"){ //always check if this is true << should this be an interrupt??
			console.log("will stop the machine");
			port.write("G28 X Y Z\n");
			currGcodeLineIdx = cnt;
			break;
		}
		else {
			console.log('[Server]'.magenta, cnt, 'th cmd is being sent to 3DP: ', gcodesTo3DP[cnt]);
			// port.write(gcodesTo3DP[cnt]);

			if(gcodeQueue.isFull()){
				delay(() => {
	        gcodeQueue.push(gcodesTo3DP[cnt]);
					// console.log('[Server]'.magenta, "queue is full; waiting 5sec...")
	  		}, 5000);
			}
			else {
				gcodeQueue.push(gcodesTo3DP[cnt]);
			}
		}
	} //end forloop

	// To see temporal gcode
	fs.writeFile('./output/segmentedGcode.gcode', gcodesTo3DP.join(','));
}


function runShellCommands(cmd1, cmd2){

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

				sendCommand();
			}); //parseGcode
		}); //EOF readfile
}


var delay = ( () => {
    var timer = 0;
    return function(callback, ms) {
        clearTimeout (timer);
        timer = setTimeout(callback, ms);
    };
})();

exports.port = port;
