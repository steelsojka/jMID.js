var fs = require('fs');
var exec = require('child_process').exec;

var CLOSURE_PATH = "build/compiler.jar";
var jsFiles = ["jMID.Util.js",
               "jMID.Event.js",
               "jMID.Stream.js",
               "jMID.Decoder.js",
               "jMID.Query.js",
               "jMID.Converter.js"];

var minify = function(file, output, callback) {
  console.log("Minifying " + file);
  var execString = ["java -jar ", CLOSURE_PATH, " --js ", file, " --js_output_file ", 
                    output].join("");

  exec(execString, callback);
};

var clean = function(callback) {
  exec("rm -rf dist", function() {
    fs.mkdir("dist",function() {
      callback();
    });
  });
};

var concat = function(files, output, callback) {
  var _files = files.map(function(a) { return "src/" + a; });
  console.log("Concatenating " + files.join(", "));

  exec("cat " + _files.join(" ") + " > " + output, callback);
};

clean(function() {
  
  concat(jsFiles, "dist/jMID.js", function() {
    minify("dist/jMID.js", "dist/jMID.min.js");
  });

  for (var i = jsFiles.length - 1; i >= 0; i--) {
    minify("src/" + jsFiles[i], "dist/" + jsFiles[i].replace(".js", ".min.js"));
  }

});



