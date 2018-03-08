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
      // my.leapmotion.on('frame', (payload) =>{
      //   console.log(payload);
      //   return;
      // })

        // my.leapmotion.on('hand', (payload) => {
        //    console.log(payload.toString());
        //    // console.log("hand obj: ", hand)
        // });
        my.leapmotion.on('gesture', (payload) =>{
          // console.log(payload.toString());
          console.log(payload.type)
        });
    }
  }).start();
}
