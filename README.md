# NodeLudo
Online multiplayer Ludo made with Node.js. 

Supports multiple games at once, spectating games and playing multiple games. Ingame chat and idle kick.

Live verson can be found here:
https://hybel.ddns.net/ludo


## Reverse proxy support with apache2

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
