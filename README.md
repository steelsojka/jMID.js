jMID.js
=========

A javascript library for reading, manipulating, and writing MIDI files.

Setup
------

jMID is setup into modules.  You either include all the modules with jMID.min.js or you can load modules seperately if you want to load them asyncronously.
Most of the modules have dependencies on other modules so You are probably better off including all modules.

```html
<script src="jMID.min.js"></script>

<!-- OR -->

<script src="jMID.Core.min.js" async></script>
<script src="jMID.Query.min.js" async></script>
<script src="jMID.Stream.min.js" async></script>
<script src="jMID.File.min.js" async></script>
<!-- etc... -->
```

Using
======

Decoding
--------

You can decoded a MIDI file by passing in the binary data to the Decoder.

```javascript
// Get the file contents through the File API or other means...

var decoder = new jMID.Decoder();

var midiFile = decoder.decode(myMidiFile); // Returns a jMID.File object
```

Notes
------

Notes are different from individual events.  A note consists of a "noteOn" event and its corresponding "noteOff" event.  Notes have their own methods for manipulation making changing note timing, length, numbers, etc... easier by adjusting the "noteOn" and "noteOff" event together.

Queries
------

Queries can be performed on the various MIDI data allowing chaining, similiar to jQuery.
Pass your jMID.File object to the jMID.Query module.

```javascript
jMID.Query(midiFile).filter("noteNumber:61"); // Return all events with note number 61

// You can also short type the query call

var jm$ = jMID.Query;

jm$(midiFile).filter("velocity>45").not("type:meta"); // All notes with a velocity greater than 45 and not of type meta

// You can even increment values

jMID.Query(midiFile).filter("noteNumber>10").increment("velocity", 25); // Raise velocity 25 of note numbers higher than 10
```

You can query notes instead of events by using the "notes" method.

```javascript
jMID.Query(midiFile).notes().not("noteNumber:41"); // All notes not number 41

jMID.Query(midiFile).notes("velocity>60"); // All notes with velocity greater than 60
```
Emitting Events
---------------

Almost any class can emit events (jMID.Note, jMID.Event, jMID.Track, etc...).  Binding a listener is the same as you would do in jQuery.

```javascript
var track = midiFile.getTrack(i);

track.on('encodeComplete', function(param1) {
  console.log("DONE ENCODING!!!");
});

track.trigger('encodeComplete', someParam); // "DONE ENCODING!!!"
// You can also pass params through the event;

```

Encoding
--------

You can encode your MIDI file after being manipulated by calling the 'encode' method or the 'base64Encode' method.

```javascript
midiFile.encode(); // Returns a binary string or the midi data

midiFile.base64Encode(); // Return a base64 encoded string of the binary data
```

Playback
---------

You can create timed playback of a decoded MIDI file with the Player class. Since the Web Audio API
allows precision timing, the best way to interact with the player is by scheduling events.

```javascript
var myPlayer = new jMID.Player({
  file : midiFile
});

/**
 * Pass in an iterator that gets added to the players schedule array.
 * When the play method is called, these iterators get called for each event
 * in the file with a calculated time when they will execute in context to 
 * the current AudioContext's current time
 */

myPlayer.addSchedule(function(event, time) { 
  if (event.subtype === "noteOn") {
    mySoundModule.triggerAtTime(time);
  }
});

myPlayer.setTempo(150); // Change the tempo.  This is best done when the player is stopped.

/** 
 * If the MIDI event is 2 seconds into the file and the current AudioContext's
 * current time is 20 seconds, the time sent to the iterator for that event
 * is 22 seconds
 */


myPlayer.play();
```

License
=========

MIT Licensed