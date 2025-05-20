# TomatoPagesBackup
FreshTomato GUI Pages Backup &amp; Restore tool

This modified version of tomato.js adds a Backup and Restore tool to the GUI to backup and restore the on screen page fields and table. It works on a page by page basis.
Since I don't know JavaScript, this tool is 100% AI generated. It works most of the time, but is a bit buggy.
The fields are backed as is, so if you modify a field without saving to nvram, the modified field will be backed up by this tool but won't be saved to nvram.
Everything appens on screen and nothing is permanantly saved until you hit the page save button.
Greyed out fields can't be restored before being enabled first.
Backup are page locked and can only be restored to the corresponding page.
It is not perfect, but it can help a little :-)

Click the little floppy disk/save button in the upper right corner of the page to show the backup and restore card at the top of the page.

# Install
To install, use this:
```
USERAGENT="Mozilla/5.0 (X11; Linux x86_64; rv:10.0) Gecko/20100101 Firefox/109.0"
alias yget="/usr/bin/wget --no-check-certificate -T 15 -q -U \"$USERAGENT\" --header \"Cache-Control: no-cache\""
yget -O- https://raw.githubusercontent.com/HommeOursPorc/TomatoPagesBackup/refs/heads/main/tomato.js | tr -d "\r" > /tmp/tomato.js
mount --bind /tmp/tomato.js /www/tomato.js
```

Installation is temporary and won't survive a reboot. You can make it permanent with JFFS or USB storage and some scripts.
