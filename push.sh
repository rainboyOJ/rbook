#!/bin/bash

rsync -avp --delete ./dist/ bohai:/www/wwwroot/rbook

# sync back
rsync -avzP --delete --exclude=dist/ . pro13:~/mycode/new_rbook_ejs
