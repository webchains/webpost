# Webpost

Webpost is a like a p2p chan site. multiple people can run a server that will handle and save posts made by users. After those posts are submitted to a server, that server than sends that data to every other server in the network.

to configure Webpost, use the .env file

here are the options

DOMAIN=polchan.live
example.com | 123.123.123.123 - either domain or ip WITHOUT slash at the end

ADDRESS=04efc71679a55706536e68ec32ba83de11b882771dbc048a296dc07e69d5b4e19f3cbc850f20c47b4d714348d79abcc99d8e86729377d2493744b98c388356040f
a45fdgtw456...... - the public key for this node

NAME=name
examplename - the name of your webchain **will be replaced if you are joining another chain as a node**

ABOUT=some chain
some description of your chain - a description of your webchain **will be replaced if you are joining another chain as a node**

PEERHTTPURL=dfsdf
http url of a node of the chain you want to join - WITHOUT the slash at the end

PEERWSURL=dsfdsfdsf
ws url of a node of the chain you want to join - WITHOUT the slash at the end

STARTUPDOWNLOAD=0
1 = yes | 0 = no - if you want to download all of the files that has been shared before you join another chain as a node

RANDOM=randomalphanumeric
some random alphanumeric name for the identity of the chain, each webchain you run must have a different identity for the database

HEARTBEAT=0
1 = yes | 0 = no - set this at 0 if you are not using any services or proxies like cloudflare/nginx/others or you can distable their time out setting for web socket connections otherwise set this at 0 then this webchain will send small data(heart beat) every 30 seconds to keep the websocket connections alive

TYPE=adminban

PACKAGE=standard

SIZELIMIT=1000000

PORT=8443
the port number for the webchain, must be a number higher than 1023 and under 49152

PROXY=1
1 = yes | 0 = no - if this webchain will be running behind nginx/caddy/cloudflare/others , 1 is yes, 0 is no

LIMITCONNECTIONS=1
limits connections per minute so the chain does not get any spam data, if you are using other proxy services or proxy servers like nginx/caddy/cloudflare/others/etc than it is better setting this at 0 since they would be better for this, if though you are only running this webchain by itself than set this at 1

SECUREDOMAIN=1
1 = yes | 0 = no - how other nodes will reach you, 1 means your url will be showing as https/wss and 0 will be meaning your url will be http/ws

SECURESERVER=1
1 = yes | 0 = no - will the server of this webchain be https/wss or http/ws, 1 is https/wss and 0 is http/ws

--------------
CONFIGURE THESE ONLY IF SECURESERVER IS 1, IGNORE THIS IF SECURESERVER IS 0, you can get certificates very easily from cloudflare or let's encrypt

CERTFILE=/home/plainstud/folder/pol/cert.pem
the path to the certificate file

CERTKEY=/home/plainstud/folder/pol/certkey.pem
the path to the certificate key file
---------------

-------------
HELP=0
1 = yes | 0 = no - if you want to help the creator/genesis address of this webchain by sending him/her some of your mining reward as a donation

HELP MUST BE 1 TO SET UP THE GIVE OPTION, IGNORE THIS IF HELP IS 0
GIVE=0
0 to 100 - the percent of your mining reward you want to donate to the creator/genesis address of the webchain **0 is minimum, 100 is maximum**
--------------