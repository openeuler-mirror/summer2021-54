import argparse
import json
import os
from collections import defaultdict
from typing import Optional

import networkx as nx
from elftools.dwarf.die import DIE
from elftools.elf.elffile import ELFFile
from networkx.classes.digraph import DiGraph
from networkx.readwrite import json_graph

Map_TypePrefix = {
    'DW_TAG_base_type': '',
    'DW_TAG_structure_type': 'struct.',
    'DW_TAG_union_type': 'union.',
    'DW_TAG_pointer_type': 'pointer.'
}

Map_AnonTypes = {
    'DW_TAG_subroutine_type': 'subroutine',
    'DW_TAG_pointer_type': 'pointer',
    'DW_TAG_union_type': 'union'
}


# recursive function to get type of a DIE node
def die_type_rec(die: DIE, prev: Optional[DIE]):
    t = die.attributes.get("DW_AT_type")
    if t is None:
        prefix = '*' if prev.tag == 'DW_TAG_pointer_type' else ''

        # got a type
        if die.attributes.get("DW_AT_name"):
            # common named type with prefix
            return prefix + Map_TypePrefix.get(die.tag, f'unknown: {die.tag}') \
                + die.attributes.get("DW_AT_name").value.decode()
        elif die.tag == 'DW_TAG_structure_type' and prev.tag == 'DW_TAG_typedef':
            # typedef-ed anonymous struct
            return prefix + 'struct.' + prev.attributes.get("DW_AT_name").value.decode()
        else:
            # no name types
            return prefix + Map_AnonTypes.get(die.tag, f'unknown: {die.tag}')
    elif t.form == 'DW_FORM_ref4':
        ref = t.value
        return die_type_rec(dwarfinfo.get_DIE_from_refaddr(ref), die)


# recursive function to get all struct members
def die_info_rec(die: DIE, name=''):
    if die.tag == 'DW_TAG_member' and die.attributes.get("DW_AT_name"):
        member_name = die.attributes.get("DW_AT_name").value.decode()
        member_type = die_type_rec(die, None)

        # save to return data
        if member_type.startswith('*'):
            # pointer member, change to *name -> type
            struct_data[name]['*'+member_name] = member_type[1:]
        else:
            struct_data[name][member_name] = member_type
        
        if args.debug:
            print(f'  > member {member_name}, type: {member_type}')

    if die.tag == 'DW_TAG_structure_type' and die.attributes.get("DW_AT_name"):
        name = 'struct.' + die.attributes.get("DW_AT_name").value.decode()
        if args.debug:
            print(f'struct {name}: ')

        # recursion into all children DIE
        for child in die.iter_children():
            die_info_rec(child, name)


# write a DiGraph to json adjacency list
def graph_write_json(G: DiGraph, file: str):
    # {"nodes": ["id": name], "adjacency": [["id": name], []]}
    data = json_graph.adjacency_data(G)

    # {name: [name, ...]}
    json_data = dict(zip([x['id'] for x in data['nodes']], [
                     [x['id'] for x in lst] for lst in data['adjacency']]))

    with open(file, 'w') as f:
        json.dump(json_data, f)


### main parser ###
parser = argparse.ArgumentParser(
    description='ELF DWARF debug info struct dependency parser')

parser.add_argument('elf_file', type=str, help='input ELF file')
parser.add_argument('--json_dir', type=str,
                    help='JSON output directory', default='./out')
parser.add_argument('--debug', help='enable debug output', action='store_true')
args = parser.parse_args()

# dict for all struct members
struct_data = defaultdict(dict)

print('Processing file:', args.elf_file)
f = open(args.elf_file, 'rb')
elffile = ELFFile(f)

if not elffile.has_dwarf_info():
    print(f'ERROR: input file {args.elf_file} has no DWARF info')
    exit(1)

dwarfinfo = elffile.get_dwarf_info()

for CU in dwarfinfo.iter_CUs():
    print('  Found a compile unit at offset %s, length %s' % (
        CU.cu_offset, CU['unit_length']))

    # Start with the top DIE, the root for this CU's DIE tree
    top_DIE = CU.get_top_DIE()

    # Display DIEs recursively starting with top_DIE
    for child in top_DIE.iter_children():
        die_info_rec(child)

f.close()

# NetworkX Graph for struct dependency graph
G = nx.DiGraph()

for struct, members in struct_data.items():
    # source struct
    G.add_node(struct)

    for n, t in members.items():
        if t.startswith('struct'):
            G.add_node(t)
            G.add_edge(struct, t)


# Write output files
if not os.path.exists(args.json_dir):
    os.makedirs(args.json_dir)

with open(os.path.join(args.json_dir, 'detail.json'), 'w') as f:
    json.dump(struct_data, f)

graph_write_json(G, os.path.join(args.json_dir, 'forward.json'))
graph_write_json(G.reverse(), os.path.join(args.json_dir, 'backward.json'))
