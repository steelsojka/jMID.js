var fs = require('fs');
var exec = require('child_process').exec;

var CLOSURE_PATH = "build/compiler.jar";
var jsFiles = ["jMID.Util.js",
               "jMID.Core.js",
               "jMID.Event.js",
               "jMID.Track.js",
               "jMID.Stream.js",
               "jMID.File.js",
               "jMID.Encoder.js",
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

var singleFileCallback = function(i) {
  if (!i) return;

  minify("src/" + jsFiles[i], "dist/" + jsFiles[i].replace(".js", ".min.js"), function() {
    singleFileCallback(--i);
  });  
};

clean(function() {
  
  concat(jsFiles, "dist/jMID.js", function() {
    minify("dist/jMID.js", "dist/jMID.min.js", function() {
      var i = jsFiles.length - 1;
      singleFileCallback(i);
    });
  });


});



