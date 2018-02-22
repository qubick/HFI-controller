var Cylon = require('cylon');

exports.leapMotion = function(){

  Cylon.robot({
    connections: {
      leapmotion: { adaptor: 'leapmotion'}
    },

    devices: {
      leapmotion: { driver: 'leapmotion'}
    },

    work: function(my){
        my.leapmotion.on('hand', (payload) => {
           console.log(payload.toString());
           // console.log("hand obj: ", hand)
        });
    }
  }).start();
}
