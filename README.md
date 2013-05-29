Umento
======
________

First attempt at a chat/game/blog site built on NodeJS and express

##Assets
This site is built on express, it uses "connect-assets" for serving coffee and stylus files,
and for browser side javascript dependency management.

##HTML
The pages are written in Jade, served by express.  Backbone handles displaying dynamic information
like chat messages and connected user counts

##Chat
The real-time chat portion of the page is created using socket.io

##Database
The backend is a mysql server, for storing the chat messages and the session data,
migrations are tracked and performed with the nodejs db-migrate library

##The Game
The game page is written using CraftyJS on the client, with the multiplayer portion being handled using socket.io
