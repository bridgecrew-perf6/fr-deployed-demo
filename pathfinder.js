//Requires
var fs = require('fs');

//Working Directories
var holdingPen = './HoldingPen/OneDrive/';
var paddock = './Public/Audio/';

//Calls
splashScreen();
pulse();

//runs forever, checks for new files, and sends appropriate files to Pathfinder
async function pulse() {
	
	//Set up a 20 second timer
    setTimeout(() => {
		
        //log timestamp of each pulse
		console.log('\nSystem Waiting');
		
		//Read all the files in the directory
		fs.readdir(holdingPen, (err, files) => {

			//for each file
			files.forEach(file => {

				//Send wav files to pathfinder for handling
				if(file.split('.').pop() == 'wav') pathfinder(file);
				
			});
		});
		
        pulse();
		
    }, 20000)
}

//Puts a file through the parse/transcribe/log/email process
async function pathfinder(file) {	
	
	//set up the full path
	var path = holdingPen + file;
	
	//delete files that are too small or too large
	var minimumFileSize = 250000; //in bytes
	var maximumFileSize = 6000000;
	var fileStats = fs.statSync(path);
    	var fileSize = fileStats['size'];		
	if ((fileSize < minimumFileSize) || (fileSize > maximumFileSize)) {
		fs.unlink(path, err => {
			if (err) throw err;
		});
	}
	
	//Process the file if it's big enough
	else {	
	
		//Send to Google for Transcription
		var transcriptionBody = await scribe(path); //Enables Transcription
		//var transcriptionBody = 'Transcription Disabled!'; //Disables Transcription
		//var transcriptionBody = 'apple seven boxcar three squirrel seventy opossum'; //Used for keyword testing
		
		//load keywords from text file into an array (keywords)
		try {
			var keywordString = fs.readFileSync('keywords.txt', 'utf8');
		} catch(e) {}
		var keywords = keywordString.split(',');
		
		//a variable to keep keyword hits in
		var keywordHits = '';
		
		//variable to show if an entry has been flagged
		var flag = false;
		var emailResponse = 'N/A';
		
		var fileString = file;
		var county 				= fileString.substring(fileString.lastIndexOf("!") + 1, fileString.lastIndexOf("@"));
		var rawTalkgroup 		= fileString.substring(fileString.lastIndexOf("@") + 1, fileString.lastIndexOf("#"));
		var rawTalkgroupID 		= fileString.substring(fileString.lastIndexOf("#") + 1, fileString.lastIndexOf("$"));
		var transmissionDate 	= fileString.substring(fileString.lastIndexOf("$") + 1, fileString.lastIndexOf("&"));
		var rawTransmissionTime = fileString.substring(fileString.lastIndexOf("&") + 1, fileString.lastIndexOf("+"));
		var talkgroup 			= rawTalkgroup.replace(', ', ' ');
		var talkgroupID 		= rawTalkgroupID.replace(', ', ' ');
		var transmissionTime 	= rawTransmissionTime.replace(/-/g,':');
		var tempCleanFile 		= (county + '-' + talkgroupID + transmissionDate + rawTransmissionTime + '.wav');
		var cleanFile 			= tempCleanFile.replace(/ /g, '');

		//loop searches for each keyword in array, assigns flag
		for (var x = 0; x < keywords.length; x++) {
			if (transcriptionBody.includes(keywords[x])) {
				flag = true;
				keywordHits = keywordHits + keywords[x] + ' ';
			}
		}
		
		//send the alert email
		if(flag) emailResponse = await sendEmail(county, (paddock + cleanFile), (transmissionDate + ' ' + transmissionTime), transcriptionBody, talkgroupID, talkgroup, keywordHits);
		
		//setup csv entry
		var entry = (
			county + ',' +
			transmissionDate + ' ' +
			transmissionTime + ',' +
			talkgroup + ',' +
			talkgroupID + ',' +
			transcriptionBody + ',' +
			'Audio/' + cleanFile + ',' +
			flag + ',' +
			keywordHits + '\n'
		);
		
		//log entry to csv OLD
		/*fs.appendFile('./public/log.csv', entry, (err) => {
			//if (err) throw err;
		})*/

		//log entry to csv NEW
		if(county == 'Harris') {
			fs.appendFile('./public/log-harris.csv', entry, (err) => {
			//if (err) throw err;
			})
		}
		else {
			fs.appendFile('./public/log.csv', entry, (err) => {
			//if (err) throw err;
			})
		}
		
		//log to console
		console.log('\nProcessing: ' + file);
		console.log('County: ' + county);
		console.log('Date: ' + transmissionDate);
		console.log('Time: ' + transmissionTime);
		console.log('Talkgroup: ' + talkgroup);
		console.log('Talkgroup ID: ' + talkgroupID);
		console.log('Transcription Body: ' + transcriptionBody);
		console.log('Keywords Found: ' + keywordHits);
		console.log('Keyword Flag: ' + flag);
		console.log('File Size: ' + fileSize + ' Bytes');
		console.log('File Moved To: ' + paddock + cleanFile);
		console.log('Email Response: ' + emailResponse);
		
		//move file
		fs.rename(path, (paddock + cleanFile), (err) => {
			//if (err) throw err;					
		});
	}
}

//sends a file (path) to Google and returns its transcription
async function scribe(path) {
	
    //Does the actual transcription of the file at path
    //Be sure to set google application credentials to auth.json!
    var speech = require('@google-cloud/speech');
    var client = new speech.SpeechClient();
    var fileName = path;

    //Reads a local audio file and converts it to base64
    var file = fs.readFileSync(fileName);
    var audioBytes = file.toString('base64');

    //setting up the request
    var recognitionMetadata = {
        microphoneDistance: 'NEARFIELD',
        interactionType: 'PRESENTATION',
        originalMediaType: 'AUDIO',
        recordingDeviceType: 'OTHER_OUTDOOR_DEVICE',
    };
    var audio = {
        content: audioBytes,
    };
    var config = {
        encoding: 'LINEAR16',
        sampleRateHertz: 48000,
        languageCode: 'en-US',
        useEnhanced: true,
        model: 'phone_call',
        metadata: recognitionMetadata,
        enableWordConfidence: true,
    };
    var request = {
        audio: audio,
        config: config,
    };

    //Detects speech in the audio file
    //-------------------------------------------------------WHITE RABBIT OBJECT
    var [response] = await client.recognize(request);
    var transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');
    var confidence = response.results
        .map(result => result.alternatives[0].confidence)
        .join('\n');

    

    //clean up the transcription a bit - no returns or newlines or commas (commas used in csv file)
    var rawTranscription = transcription.replace(/(\r\n|\n|\r|,)/gm, '');
	var cleanTranscription = rawTranscription.toLowerCase();
	
	//return the trancription body
	return cleanTranscription;
}

//sends an email when the system flags a keyword
async function sendEmail(county, path, time, body, talkgroup, talkgroupDescription, positiveKeywords) {
    //declarations
	//Code removed for privacy

    //set up the url for the audio link
    var ipPath = 'http://' + ipAddress + ':' + port + '/';
    path = path.replace(/\\/g, '/');//replaces backslashes with forward slashes to make email link work
    var emailPath = path.substring(9); //removes '/public/' from the direct to audio url
    var urlPath = ipPath + emailPath; //adds server IP address to the file path for direct to audio url

	//set up gmail credentials
	//Can this use a text file like keywords do? Does it need to?
    var transporter = nodemailer.createTransport({
        //code removed for privacy
    });

	//Configure the email
    var mailOptions = {
        //Code removed for privacy
		
        subject: (county + ': ' + positiveKeywords + ': ' + time),
		
        html: (
			'<b>Transcription:</b><br>' + body + '<br><br>' +
            '<b>Talkgroup:</b> ' + talkgroupDescription + ' (' + talkgroup + ')<br>' +
            '<b>Time:</b> ' + time + '<br>' +
            '<b>Keywords:</b> ' + positiveKeywords + '<br>' +
            '<b>Audio Direct Link: </b><a href = "' + urlPath + '">Click Here</a><br>' +
            '<b>' + county + ' County Feed: </b><a href = "' + ipPath + 'index.html">Click Here</a><br><br>'
        )
    };

	//Send the email
	//var responseBody = '';
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {} 
		else {}
    });
	
	//need to add a return here
	//console.log('ResponseBody: ' + responseBody);
	return 'OK';
	//return responseBody;
}

//prints the splash screen on the console
function splashScreen() {
	console.clear();
	console.log('###############################################');
	console.log('#                                             #');
	console.log('#           P A T H F I N D E R    2          #');
	console.log('#                                             #');
	console.log('###############################################');
	console.log('\n\nSystem Ready');
}