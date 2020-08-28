# NodeLudo
Online multiplayer Ludo made with Node.js. 

Supports multiple games at once, spectating games and playing multiple games. Ingame chat and idle kick.

Live verson can be found here:
https://hybel.ddns.net/ludo

## Requirements
Requires npm and Node.js(version 10.9.0. or newer) to be installed on the system.

## Installing and running
```
git clone https://github.com/trygve55/NodeLudo.git
npm install
npm start
```

## Configuration

### Changing port
Change the line ```port: 8080,``` in ```config.js``` to whatever port you want to run the server on.

### Reverse proxy support with apache2

In config.js change:
```
baseUrl: '/'
```
to:
```
baseUrl: '/ludo/'
```

Lines required in apache viritual host:
```
    ProxyPass /ludo http://localhost:8080/ludo
    ProxyPassReverse /ludo http://localhost:8080/ludo

    RewriteEngine on
    RewriteCond %{HTTP:UPGRADE} ^WebSocket$ [NC]
    RewriteCond %{HTTP:CONNECTION} ^Upgrade$ [NC]
    RewriteRule .* ws://localhost:8080%{REQUEST_URI} [P]
```
