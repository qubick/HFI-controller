var Cylon = require('cylon');

var gestureId = 0;
var server = require('../server.js');

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
        // console.log("port in LeapMotion: ", server.port)
        gestureId = payload.pointableIds;
        console.log('[Leapmotion]'.violet, payload.type, ' is detected')

        if(payload.type === 'circle'){
            console.log('[Leapmotion]'.violet, 'circle radius: ', payload.radius);
            // server.port.write('G0 X80 Y80 F1800\n');

        }
        else if(payload.type === 'swipe'){
            console.log('[Leapmotion]'.violet, 'Swipe direction: ', payload.direction);
            var currPos = server.port.write('M114\n'); //this only returns T/F
            console.log('[Leapmotion]'.violet, 'curr head Pos: ', currPos, "\n");

        }
        else if(payload.type === 'keyTap'){

        }
        else if(payload.type === 'screenTap'){

        }
      });
    }
  }).start();
}
