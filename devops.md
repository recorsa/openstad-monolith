Gebruikte tech
--------------
* MySQL
* Node.js — Runtime
* PM2 — [Process manager](http://pm2.keymetrics.io/)
* Git

Alles is opgezet vanuit ubuntu user `daan`, op een paar `sudo` dingen na:

* Apache config.
* `certbot-auto` SSL request/renewal cron.

MySQL
-----
* Inloggegevens zijn te vinden in `/var/www/stemvanwest.amsterdam.nl/www/current/config/local.json`.
* Backups worden nachtelijks gemaakt en gaan naar `/var/www/stemvanwest.amsterdam.nl/backups`. Één keer in de week wordt er een backup gemaakt waar ook alle geüploade afbeeldingen inzitten.
* Backup cron job is geconfigureerd onder user `daan`.

Node.js
-------
* Site is een Javascript applicatie, en heeft dus een runtime. Als het goed is start deze runtime nu automatisch als de server herstart wordt, maar laten we dat de komende weken maar niet testen :)
* Code is te vinden onder `/var/www/stemvanwest.amsterdam.nl/www`. Huidige deploy staat onder `current`.

PM2
---
* Process manager voor de staging- en live runtime.
* `pm2 status` voor een overzicht van de draaiende runtimes.
* `pm2 show 0` voor meer info over de live (ID nummer is te vinden in de status tabel). In de info die nu verschijnt is ook de locatie van de logbestanden terug te vinden.
* `pm2 startOrRestart 0` om de live te restarten. **Als de gehele server herstart is en de applicaties draaien niet, dan heeft dit commando geen zin — PM2 heeft nog geen weet van welke runtimes er zijn. Run in dat geval `pm2 startOrRestart ecosystem.config.js` vanuit de `current` map. Dan wordt het PM2 config bestand uitgelezen en alle runtimes gestart.**
* Verdere documentatie is te vinden op [de website van PM2](http://pm2.keymetrics.io/).

Git
---
* De bare git repo is te vinden op `ssh://git@git.daanmortier.nl/abtool`. De server heeft read-only toegang tot deze repo o.b.v. de public key onder `/home/daan/.ssh`.


Install history
---------------
Mijn bash history tijdens installatie, met wat comments:

```bash
screen -RDS installation
sudo su

# Apache / MySQL
# --------------
apt-get remove nginx
apt-get install apache2
apt-get install mysql-server mysql-client
# Removes nginx-server, nginx-common etc.
apt autoremove
mysql_secure_installation
# TODO: Create database.
# TODO: Setup read/write user for database.

# Node
# ----
# TODO: Ubuntu 16 has `nvm` in APT?
apt-get install build-essential libssl-dev
exit
cd ~
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash
source .bashrc
# Test: should output nvm
command -v nvm
nvm install node
# Test: should output node version
node -v

# Git
# ---
sudo apt-get install git
git --version

# Certbot
# -------
sudo su
cd /usr/bin
wget https://dl.eff.org/certbot-auto
chmod a+x certbot-auto
exit

# Configure apache
# ----------------
# Set up correct virtual host(s)

# Initialize SSL certificate
# --------------------------
sudo su
apachectl stop
# Choose standalone server, enter correct URL
certbot-auto certonly
apachectl start

# Generate SSH key
# ----------------
# This key must be added to the git permissions of git.daanmortier.nl
ssh-keygen -t rsa -b 4096 -C "Openstadsdeel Server"

# Install application
# -------------------
# [ON LOCAL BOX]
npm install -g pm2
git clone --recursive git.daanmortier.nl/abtool
npm install
pm2 deploy production setup
# [END LOCAL]

cd /var/www/stemvanwest.amsterdam.nl/www/current
git submodule init
git submodule update
# Edit so that this git repository has access to all branches, not just master.
# Seems to be a bug in PM2.
git config -e
# Create config/local.json with connection settings etc.
nano config/local.json

# [ON LOCAL BOX]
pm2 deploy production [--force]
# [END LOCAL]
```