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

# Check file type, convert to IR
ir_file=""

if [[ "$FILE" == *.ir ]] || [[ "$FILE" == *.ll ]]; then
    ir_file=$FILE
elif [[ "$FILE" == *.bc ]]; then
    echo "Input file $FILE is bitcode, running llvm-dis"
    ir_file=$(mktemp --suffix '.ll')
    llvm-dis "$FILE" -o "$ir_file"
else
    echo "Input file $FILE coule be ELF, running extract-bc and llvm-dis"
    ir_file=$(mktemp --suffix '.ll')
    extract-bc -o - "$FILE" | llvm-dis - -o "$ir_file"
fi

echo "Parsing IR file $ir_file..."
python3 ir_parser/main.py "$ir_file" --json_dir web/data

# Start HTTP server
python3 -m http.server -d web/ -b $HOST $PORT
