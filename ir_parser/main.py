#!/usr/bin/env python3
import os
import argparse
import json
import re
import networkx as nx
from networkx.classes.digraph import DiGraph
from networkx.readwrite import json_graph

parser = argparse.ArgumentParser(
    description='LLVM IR struct dependency parser')

parser.add_argument('ir_file', type=str, help='input IR file')
parser.add_argument('--json_dir', type=str,
                    help='JSON output directory', default='./out')
args = parser.parse_args()


# write a DiGraph to json adjacency list
def write_json(G: DiGraph, file: str):
    # {"nodes": ["id": name], "adjacency": [["id": name], []]}
    data = json_graph.adjacency_data(G)

    # {name: [name, ...]}
    json_data = dict(zip([x['id'] for x in data['nodes']], [
                     [x['id'] for x in lst] for lst in data['adjacency']]))

    with open(file, 'w') as f:
        json.dump(json_data, f)


regex_typename = re.compile(r'%[A-Za-z0-9._]+')
regex_anon = re.compile(r'(struct|union).anon(.\d+)?')
regex_typedef = re.compile(r'^%([A-Za-z0-9._]+)\s+=\s+type\s+\{(.+)}$')
regex_whitesp = re.compile(r'\s+')

G = nx.DiGraph()

typedef = {}
with open(args.ir_file, 'r') as ir:
    for line in ir:
        m = regex_typedef.match(line)
        if m:
            # name -> definition pair
            typedef[m.group(1)] = regex_whitesp.sub('', m.group(2))

for name, defi in typedef.items():
    # skip anonymous structs
    if regex_anon.match(name):
        continue

    # source struct
    G.add_node(name)

    # match all member structs
    for child in regex_typename.findall(defi):
        child = child[1:]  # skip %
        # skip anonymous member of structs
        if regex_anon.match(child):
            continue

        G.add_node(child)
        G.add_edge(name, child)

print(
    f"Dependency graph has {G.number_of_nodes()} nodes and {G.number_of_edges()} edges")

if not os.path.exists(args.json_dir):
    os.makedirs(args.json_dir)

write_json(G, os.path.join(args.json_dir, 'forward.json'))
write_json(G.reverse(), os.path.join(args.json_dir, 'backward.json'))
