# Reprap 3D printer controller for HFI in Javascript

## To do
- browserify main.js

## Reference
* [OpenCV js](https://docs.opencv.org/trunk/d2/df0/tutorial_js_table_of_contents_imgproc.html)
* [OpenCV js examples](https://community.risingstack.com/opencv-tutorial-computer-vision-with-node-js/)


1. Get the OpenCV source
```
git clone https://github.com/opencv/opencv
cd opencv
```

2. Install emscripten. It is LLSVM to script interpreter.
Get it from [Emscripten](https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html)
* Fetch the latest registry of available tools.
```
./emsdk update
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```
3. (optional) Patch emscripten & rebuild
(See https://github.com/ucisysarch/opencvjs for further info)

4. In opencv directory, build js
```
cd opencv
python ./platforms/js/build_js.py build_js
```
