#!/bin/sh

echo Beautifying files...

find . -type f -name "*.js" -exec js-beautify -r -m 2 -s 2 {} \;

git add -A