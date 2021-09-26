#!/bin/bash

# Argparse
HOST=0.0.0.0
PORT=8000

while getopts "hp:b:" flag; do
case "$flag" in
    h)
      echo "Usage: $0 [-h] [-b ADDRESS] [-p PORT] input_file"
      exit 0
      ;;
    p) PORT=$OPTARG;;
    b) HOST=$OPTARG;;
esac
done

FILE=${@:$OPTIND:1}

echo "Parsing ELF file $FILE..."
python3 dwarf_parser/main.py "$FILE" --json_dir web/data

# Start HTTP server
python3 -m http.server -d web/ -b $HOST $PORT
