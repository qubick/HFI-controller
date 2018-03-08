var maxQueueSize = 50;

exports.Node = function(value){
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
    if(this.first === null){
      this.first = item;
      this.last = item;
    }
    else {
      this.last.next = item;
      this.last = this.last.next;
    }
    itemCnt++;
  }

  this.pop = function(){
    var item = this.first.data;
    this.first = this.first.next;

    return item;
  }

  this.printQueue = function(){
    var temp = this.first;
    while(temp){
      console.log(temp.data);
      temp = temp.next;
    }
  }
}
