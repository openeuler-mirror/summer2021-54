#!/usr/bin/env python3
import sys
import re
import networkx as nx
from networkx.drawing.nx_pydot import write_dot

if(len(sys.argv) < 3):
    print(f"usage: {sys.argv[0]} ir_file dot_file")
    exit(255)

ir_file = sys.argv[1]
dot_file = sys.argv[2]

regex_typename = re.compile(r'%[A-Za-z0-9._]+')
regex_anon = re.compile(r'(struct|union).anon(.\d+)?')
regex_typedef = re.compile(r'^%([A-Za-z0-9._]+)\s+=\s+type\s+\{(.+)}$')
regex_whitesp = re.compile(r'\s+')

G = nx.DiGraph()

typedef = {}
with open(ir_file, 'r') as ir:
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

print(f"Dependency graph has {G.number_of_nodes()} nodes and {G.number_of_edges()} edges")
write_dot(G, dot_file)
