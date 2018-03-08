var Cylon = require('cylon');

var gestureId = 0;
// var

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
      //   // return;
      // });

        // my.leapmotion.on('hand', (payload) => {
        //    console.log(payload.toString());
        //    // console.log("hand obj: ", hand)
        // });
        my.leapmotion.on('gesture', (payload) =>{
          // console.log(payload.toString());
          gestureId = payload.pointableIds;

          if(payload.type === 'circle'){
              console.log("circle radius: ", payload.radius)
              // port.write();
          }
          else if(payload.type === 'swipe'){
              console.log("direction: ", payload.direction)
          }
          else if(payload.type === 'keyTap'){

          }
          else if(payload.type === 'screenTap'){

          }
        });
    }
  }).start();
}
