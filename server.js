var express = require("express")
var app = express();
var fs = require("fs");
var http = require("http");

var reqIdx = 0;

//server main page1 - video stream based
app.get("/", (req, res) => {
	res.sendfile('index.html')
});

app.listen(5555, () => {
	console.log("example app listening on port 5555")
});

app.post("/user/add", function(req, res){
	res.send("OR");
});

app.get(/^(.+)$/, function(req, res){
	console.log('static file requre: ' + req.params);
	res.sendFile(__dirname + req.params[0]);
});
