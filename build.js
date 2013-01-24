var fs = require('fs');
var exec = require('child_process').exec;

var CLOSURE_PATH = "build/compiler.jar";

fs.readdir("src/", function(err, files) {
  var jsFiles = files.filter(function(a) { 
    return a.search(".js") !== -1; 
  });

  for (var i = jsFiles.length - 1; i >= 0; i--) {
    minify("src/" + jsFiles[i], "dist/" + jsFiles[i].replace(".js", ".min.js"));
  }

  concat(jsFiles, "dist/jMID.js", function() {
    minify("dist/jMID.js", "dist/jMID.min.js");
  });

});

var minify = function(file, output, callback) {
  var execString = ["java -jar ", CLOSURE_PATH, " --js ", file, " --js_output_file ", 
                    output].join("");

  exec(execString, callback);
};

var concat = function(files, output, callback) {
  var _files = files.map(function(a) { return "src/" + a; });

  exec("cat " + _files.join(" ") + output, callback);
};
