//queue console log message color scheme: cyan

var maxQueueSize = 25;
var server = require('../server.js');
// var port = server.port;

var Node = function(value){
  this.data = value;
  this.next = null;
}

exports.Queue = function(){
  var itemCnt = 0;

  this.first = null;
  this.last = null;

  console.log('\n[Queue]'.cyan, 'An empty gcode queue is created');

  this.isFull = function(){
    if(itemCnt === maxQueueSize)
      return true;
    else
      return false;
  }

  this.isEmpty = function(){
    if(this.first === null)
      return true;
    else
      return false;
  }

  this.push = function(item){
    var newNode = new Node(item);

    if(this.first === null){

      this.first = newNode;
      this.last = newNode;
      console.log('[Queue]'.cyan, "first item ", item, " is saved");
    }
    else {
      this.last.next = newNode;
      this.last = this.last.next; //this queue does not consist of node;
      console.log('[Queue]'.cyan, itemCnt, "th item ", item, " is saved")
    }
    itemCnt++;

    while(itemCnt != 0)
      this.printQueue(); //self run when the queue is not anymore empty
  }

  this.pop = function(){
    var value = this.first.data;
    this.first = this.first.next;

    itemCnt--;
    return value;
  }

  this.printQueue = function(){
    var temp;

    while(!this.isEmpty()){
      temp = this.pop();

      console.log('[Queue]'.cyan, "Will send the gcode line to 3DP: ", temp);
      console.log("server.port ", server);
      // server.port.write(temp);
    }
  } // EOF printQueue();
}
