var gcodeObject;

// function readGcodeFile(file){
//   var rawFile = new XMLHttpRequest();
// 
//   rawFile.open("GET", file, false);
//   rawFile.onreadystatechange = function (){
//     if(rawFile.readyState === 4){
//       if(rawFile.status === 200 || rawFilestatus === 0){
//         var allText = rawFile.responseText;
//         alert(allText);
//       }
//     }
//   }
// }

function handleFiles(input) {

    const file = input.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
        const file = event.target.result;
        const allLines = file.split(/\r\n|\n/);
        // Reading line by line
        allLines.map((line) => {
            console.log(line);
        });
    };

    reader.onerror = (evt) => {
        alert(evt.target.error.name);
    };

    reader.readAsText(file);
}

}