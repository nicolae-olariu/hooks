#!/bin/sh

echo Beautifying files...
find . -type f -name "*.js" -exec js-beautify -r {} \;
