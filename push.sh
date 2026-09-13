#!/bin/bash


npx rbook build --profile full
rsync -avp --delete ./dist/ bohai:/www/wwwroot/rbook.roj.ac.cn

# sync back
#rsync -avzP --delete --exclude=dist/ . pro13:~/mycode/new_rbook_ejs
