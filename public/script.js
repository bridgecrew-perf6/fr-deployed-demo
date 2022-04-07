//Global variable to hold the last clicked row id
var lastClickedRowId;

//Load the table immediately
var resultArray = []; //Global array to hold part/all of the CSV in an array
parseResult(loadFile("log.csv")); // Takes the CSV file and turns it into an array //this is probably the source of the length causes no audio bug - call it again down below
displayData(resultArray, 100); // WHITE RABBIT OBJECT

// listen for clicks in the table
$('#feedDivider').on('click', '.clickable', function () {
	
	// get the event target ID & parse out path
	var rowId = event.target.id;
	rowId = 'R' + rowId.substring(1);
	var path = document.getElementById('F' + rowId.substring(1)).innerHTML;
	
	//play the audio in the path
	updateSource(path);
	
	//highlight where the last click happened
	lastClickedRowId = rowId;
	
	//get the metadata from the last row click
	var time = document.getElementById('A' + rowId.substring(1)).innerHTML;
	var county = document.getElementById('B' + rowId.substring(1)).innerHTML;
	var talkgroup = document.getElementById('C' + rowId.substring(1)).innerHTML;
	var transcript = document.getElementById('D' + rowId.substring(1)).innerHTML;
	var flag = document.getElementById('E' + rowId.substring(1)).innerHTML;
	
	//update the metadata table
	updateInfo(time, county, talkgroup, transcript, flag);
	
	//color the row
	document.getElementById(lastClickedRowId).style.backgroundColor = "DarkOrange";
	document.getElementById(lastClickedRowId).style.color = "white";
})

//listen for the audio player to reach the end of a file
var audioPlayer = document.getElementById("player");
audioPlayer.onended = function() {
	
	//get the state of the directional dropdown
	var dropdownDirection = document.getElementById('autoplayDirection');
	var autoplayDirection = dropdownDirection.value;
	
	//Get the next row Id using the direction from the 
	switch(autoplayDirection) {
		case 'Backward' :
			var nextRowId = document.getElementById(lastClickedRowId).nextElementSibling.id;
			var nextPath = document.getElementById('F' + nextRowId.substring(1)).innerHTML;	
			nextUp(nextPath, nextRowId)
			break;
			
		case 'Forward' :
			var nextRowId = document.getElementById(lastClickedRowId).previousElementSibling.id;
			var nextPath = document.getElementById('F' + nextRowId.substring(1)).innerHTML;
			nextUp(nextPath, nextRowId)
			break;
			
		case 'None' :
			break;
			
		default:
			break;
	}
	
};

//autoplay the next row
function nextUp(nextPath, nextRowId) {
	
	//send the audio path to the player
	updateSource(nextPath);
	
	//get the metadata from the next row
	var time = document.getElementById('A' + nextRowId.substring(1)).innerHTML;
	var county = document.getElementById('B' + nextRowId.substring(1)).innerHTML;
	var talkgroup = document.getElementById('C' + nextRowId.substring(1)).innerHTML;
	var transcript = document.getElementById('D' + nextRowId.substring(1)).innerHTML;
	var flag = document.getElementById('E' + nextRowId.substring(1)).innerHTML;
	
	//update the metadata table
	updateInfo(time, county, talkgroup, transcript, flag);
	
	//color the row
	document.getElementById(nextRowId).style.backgroundColor = "DarkOrange";
	document.getElementById(nextRowId).style.color = "white";
	
	//update the lastClickedRowId
	lastClickedRowId = nextRowId;
}

//update metadata
function updateInfo(time, county, talkgroup, transcript, flag) {
	var metadataTable = document.getElementById('metadata');
	metadataTable.rows[0].cells[0].innerHTML = '<center>' + county + ' County ' + time;
	metadataTable.rows[1].cells[0].innerHTML = '<center>' + talkgroup;
	metadataTable.rows[2].cells[0].innerHTML = '<center>' + transcript;
}

//Clears the feed table
function clearFeed() {
	
	var table = document.getElementById("feedTable");
	table.remove(); 
	
	var newTable = document.getElementById('feedDivider');
	newTable.innerHTML = '<table id="feedTable" width="100%" ><tr><td width="7%"></td><td width="3%"></td><td width="15%"></td><td width="65%"></td><td width="5%"></td><td width="5%" style="display:none;"></td></tr></table>';

}
//updates source for audio element
function updateSource(audioPath){
	
	//send the audio to the player
	var audio = document.getElementById('player');
	audio.src = audioPath;
	audio.load();
	audio.play();
	
}

//updates the feed using dropdown specs
function updateFeed() {
	//reload csv into the array
	//parseResult(loadFile("log.csv"));

	//get the values from the dropdowns
	var dropdownFeedLength = document.getElementById('feedLengthSelection');
	var feedLength = dropdownFeedLength.value;
	var dropdownSortType = document.getElementById('feedSortSelection');
	var feedSort = dropdownSortType.value;
	
	//handle full length requests
	if(feedLength == 'ALL') feedLength = resultArray.length - 2;
	console.log(feedLength);	
	
	//clear the table
	clearFeed();
	
	//update the feed
	displayData(resultArray, feedLength); // WHITE RABBIT OBJECT
	
	//sort the feed based on user selection
	switch(feedSort) {
		case 'Time' :
			sortTable(0);
			sortTable(0);
			break;
			
		case 'County' :
			sortTable(1);
			break;
			
		case 'Talkgroup' :
			sortTable(2);
			break;
			
		case 'Flag' :
			sortTable(4);
			sortTable(4);
			break;
		
		default:
			sortTable(0);
			break;
	}
}

//updates table with data from csv
function displayData(CSVARRAY, displayBuffer) {
	
	var table = document.getElementById("feedTable"); //identifies the table element
	var csvLength = CSVARRAY.length - 1;
	var tableLength = csvLength - displayBuffer;
	
	if (tableLength < 0) tableLength = 0;
	if (tableLength > csvLength) tableLength=csvLength;
	
	for (var x = tableLength; x < csvLength; x++) {
		
		//insert a row
		var row = feedTable.insertRow(1);
		row.id = ('R' + x);
		row.className = ("clickable");

		//set up row variables
		var cell0 = row.insertCell(0);
		var cell1 = row.insertCell(1);
		var cell2 = row.insertCell(2);
		var cell3 = row.insertCell(3);
		var cell4 = row.insertCell(4);
		var cell5 = row.insertCell(5);	

		//set up the audio file path
		var audiopath = ('<audio controls preload="none"> <source src="' + CSVARRAY[x][5] + '" type="audio/wav"> </audio>');
		//console.log('Audio path assigned: ' + audiopath);
		
		//fix the date format
		var rawDate = CSVARRAY[x][1];	
		var month = rawDate.substring(rawDate.indexOf('-') + 1, rawDate.lastIndexOf('-'));	
		switch(month) {
			case '01': month = 'Jan'; break;			
			case '02': month = 'Feb'; break;			
			case '03': month = 'Mar'; break;
			case '04': month = 'Apr'; break;
			case '05': month = 'May'; break;
			case '06': month = 'Jun'; break;
			case '07': month = 'Jul'; break;
			case '08': month = 'Aug'; break;
			case '09': month = 'Sep'; break;
			case '10': month = 'Oct'; break;
			case '11': month = 'Nov'; break;
			case '12': month = 'Dec'; break;			
			default: break;
		}	
		var date = rawDate.substring(rawDate.lastIndexOf('-') + 1, rawDate.indexOf(' '));
		var time = rawDate.substring(rawDate.lastIndexOf(' '));
		var cleanDate = (month + '-' + date + ' ' + time);
		
		
		//modify the html with csv data
		//column by column for every row in the csv
		//cell0.innerHTML = CSVARRAY[x][1];
		cell0.innerHTML = cleanDate;
		cell1.innerHTML = CSVARRAY[x][0];
		cell2.innerHTML = CSVARRAY[x][2];
		cell3.innerHTML = CSVARRAY[x][4];		
		if (CSVARRAY[x][6] == 'true') cell4.innerHTML = '<img src = "/img/logo.png" height=40 width=40>';//------------------------------!!!! Change this! Excel makes it all caps!
		cell5.innerHTML = CSVARRAY[x][5];
		
		//make cell5 invisible
		cell5.style.display = 'none';
		
		//set unique IDs for every cell
		cell0.id = ('A' + x);	
		cell1.id = ('B' + x);	
		cell2.id = ('C' + x);	
		cell3.id = ('D' + x);	
		cell4.id = ('E' + x);	
		cell5.id = ('F' + x);
		
		
	}
	
} 

//gets data and returns a string
function loadFile(filePath) {
	
	var result = null;
	var xmlhttp = new XMLHttpRequest();
	
	xmlhttp.open("GET", filePath, false);
	xmlhttp.send();
	
	if (xmlhttp.status == 200) {
		result = xmlhttp.responseText;
	}
	
	return (result);
}

//parses data into an array
function parseResult(result) {

	result.split("\n").forEach(function(row) { // defines row delimiter
		var rowArray = [];
		row.split(",").forEach(function(cell) { //defines cell delimiter
			rowArray.push(cell);
		});
		resultArray.push(rowArray);
	});
	
}

//Sorts the table by column n
function sortTable(n) {
	
	var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
	table = document.getElementById("feedTable");
	switching = true;

	// Set the sorting direction to ascending:
	dir = "asc";

	/* Make a loop that will continue until
	no switching has been done: */
	while (switching) {

		// Start by saying: no switching is done:
		switching = false;
		rows = table.rows;

		/* Loop through all table rows (except the
		first, which contains table headers): */
		for (i = 1; i < (rows.length - 1); i++) {
			// Start by saying there should be no switching:
			shouldSwitch = false;

			/* Get the two elements you want to compare,
			one from current row and one from the next: */
			x = rows[i].getElementsByTagName("TD")[n];
			y = rows[i + 1].getElementsByTagName("TD")[n];

			/* Check if the two rows should switch place,
			based on the direction, asc or desc: */
			if (dir == "asc") {
				if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
					// If so, mark as a switch and break the loop:
					shouldSwitch = true;
					break;
				}
			} 
			else if (dir == "desc") {
				if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
					// If so, mark as a switch and break the loop:
					shouldSwitch = true;
					break;
				}
			}
		}
		if (shouldSwitch) {
			/* If a switch has been marked, make the switch
			and mark that a switch has been done: */
			rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
			switching = true;
			// Each time a switch is done, increase this count by 1:
			switchcount ++;
		} 
		else {
			/* If no switching has been done AND the direction is "asc",
			set the direction to "desc" and run the while loop again. */
			if (switchcount == 0 && dir == "asc") {
				dir = "desc";
				switching = true;
			}
		}
	}
}