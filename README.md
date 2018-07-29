# MIWeb.Composer
MIWeb.Composer is a browser based audio synthesizing project.
It's targeted to be a open, free and easy to use tool to synthesize audio samples and compose tracks from it.
At the current state of development only the synthesizer is available.

Feel free to use and improve the tool. Pull requests are welcome.

## Setup
I will alway try to keep the application client based, 
so downloading the app directory and opening the index.html in a modern browser will be enough to run it.

If you want to use it as a containerized application, follow the steps below:
1. Install docker and docker compose on your system
2. Clone or download this directory
3. Modify the included .env file to your needs (includes container name and port)
4. Execute the start script via "sudo ./start" or run "docker-compose up" inside the project folder
5. Open a connection to the app via browser. Using the included .env file it should be "http://localhost:8011"
