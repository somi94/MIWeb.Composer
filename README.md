# MIWeb.Composer
MIWeb.Composer is a browser based audio synthesizing project.
It's targeted to be a open, free and easy to use tool to synthesize audio samples and compose tracks from it.
At the current state of development only the synthesizer is available.

Feel free to use and improve the tool. Pull requests are welcome.

## Setup
Basically you have 3 Options to use this app.

### Run build
If you just want to test the build version of this app, do the following:
1. Download the app/build folder
2. Open index.html in a modern web browser

If you want to improve it, follow these steps:
1. Download the app/src folder
2. Edit files as pleased
3. Open index.html in a modern web browser

If you want to use it as a containerized application, follow the steps below:
1. Install docker and docker compose on your system
2. Clone or download this directory
3. Modify the included .env file to your needs (includes container name and port)
4. Execute the start script via "sudo ./start" or run "docker-compose up" inside the project folder
5. Open a connection to the app via a modern web browser browser. Using the included .env file should lead to the url "http://localhost:8011".
