Fire Relay - Summary

This repository includes much of the code for the Fire Relay project.

Some features & code had to be removed for security/privacy reasons.

Fire Relay uses Software Defined Radio and Google Speech-to-Text API to generate leads
in the restoration contracting industry. Remote PCs equipped with SDR radios and
off-the shelf software record radio transmissions on Fire and EMS channels, then upload
the clips to a central server. When the server detects a new file, it sends the file 
to Google for transcription. When the response arrives, the transcription is searched
for keywords, email alerts are sent if necessary, the transcription and metadata are 
logged in a CSV, and the audio file is renamed and stored.

Pathfinder.js - NodeJS back end app that runs on the server. Detects new files, transcribes,
sends email alerts, etc. Requires an auth key to function, but a live demo is available.

/Public/ - Contains index.html, style.css, and script.js, which all run the front end page.
The public section should run fine on localhost, including some example transcriptions.

Mark Cusimano, 7 April 2022