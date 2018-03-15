//queue console log message color scheme: cyan
var Promise = require('promise');
var server = require('../server.js');
const MAXQUESIZE = 25;
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
    if(itemCnt === MAXQUESIZE)
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
      console.log('[Queue]'.cyan, "Queue was empty. First item is saved", item);
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
    var temp = this.pop();

    while(!this.isEmpty()){

      // var promise = new Promise((resolve, reject) =>{
        if(temp.charAt[0] != (';' || ' ')) { //this is comment, pass
          console.log('[Queue]'.cyan, "Sending gcode to 3DP: ", temp);

          promise.then((result)=>{
            console.log("message sent")
          })
        }
      // })
    }
  } // EOF printQueue();
}
