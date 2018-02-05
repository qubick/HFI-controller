# Reprap 3D printer controller for HFI in Javascript

## To do
* browserify main.js
* connect serialPort
* ~~capture cam twice (with interval) and save ~~
* ~~load captured images using cv.imshow ~~
* ~~compare diff (subtract background) ~~
* build gcode viewer (interpreter) on the editor

## Reference
[OpenCV js]
(https://docs.opencv.org/trunk/d2/df0/tutorial_js_table_of_contents_imgproc.html)
[OpenCV js examples
(https://community.risingstack.com/opencv-tutorial-computer-vision-with-node-js/)


1. Get the OpenCV source
```
git clone https://github.com/opencv/opencv
cd opencv
git checkout 3.1.0
```

2. Install emscripten. It is LLSVM to script interpreter.
Get it from [Emscripten](https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html)
* Fetch the latest registry of available tools.
```
./emsdk update
```
* Download and install the latest SDK tools.
```
./emsdk install latest
```
* Make the "latest" SDK "active" for the current user. (writes ~/.emscripten file)
```
./emsdk activate latest
```
* Activate PATH and other environment variables in the current terminal
```
source ./emsdk_env.sh
```
3. (optional) Patch emscripten & rebuild
(See https://github.com/ucisysarch/opencvjs for further info)

4. In opencv directory, build js
```
cd opencv
python ./platforms/js/build_js.py build_js
```