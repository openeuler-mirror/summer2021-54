var init_level = 5;
nodes_state = new Map();

// create vis;
var nodes = new vis.DataSet(new Array());
var edges = new vis.DataSet(new Array());

// create a network;
var container = document.getElementById("mynetwork");

var data = { nodes: nodes, edges: edges };
var options = {
    interaction: { hover: true },
    layout: { hierarchical: { direction: 'LR', sortMethod: 'directed', shakeTowards: 'leaves', levelSeparation: 250 } },
    edges: {
        smooth: true,
        arrows: { to: true },
    },
    nodes: {
        shape: "box",
        margin: 5,
    },
};
var network = new vis.Network(container, data, options);

function formSubmit() {

    nodes.clear();
    edges.clear();

    // 清空表格中之前的内容;
    var tbody = document.getElementById("tbody");
    tbody.innerHTML = '';

    var struct = document.getElementById("struct_input").value;

    nodes.add({ id: struct, label: struct, level: init_level, count: 0 });
    nodes_state.set(struct, "expanded");
    addNodes(nodes.get(struct));


    network.on("doubleClick", function (params) { //双击事件;
        if (params.nodes.length === 0) { return; } //排除非节点双击事件;

        var nodeID = params.nodes[0];
        var clickedNode = nodes.get(nodeID);

        if (nodes_state.get(nodeID) === "expanded") { //已展开的结点;
            nodes_state.set(nodeID, "added");
            delNodes(clickedNode);
            return;
        }

        // 加入新展开结点的部分;
        nodes_state.set(nodeID, "expanded");
        addNodes(clickedNode);
    });

    network.on("click", function (params) { //单击事件;
        if (params.nodes.length === 0) { return; } //排除非节点单击事件;

        var curNode = params.nodes[0];
        var detail_struct = document.getElementById("detail_struct");
        detail_struct.innerHTML = curNode;

        // 清空表格中之前的内容;
        var tbody = document.getElementById("tbody");
        tbody.innerHTML = '';

        if (detailInfo[curNode] == undefined) { return; }

        // 添加新的信息;
        Object.keys(detailInfo[curNode]).forEach(function (member) {
            var tr = document.createElement("tr");
            var td = document.createElement("td");
            td.innerHTML = detailInfo[curNode][member];
            tr.appendChild(td);
            var td = document.createElement("td");
            td.innerHTML = member;
            tr.appendChild(td);
            tbody.appendChild(tr);
        });
    });

}



function addNodes(clickedNode) {
    nodeID = clickedNode.id;
    forwardInfo[nodeID].forEach(function (node) {
        if (!nodes_state.has(node)) {
            nodes_state.set(node, "added");
            nodes.add({ id: node, label: node, level: clickedNode.level + 1 });
        }
        try {
            edges.add({ id: nodeID + '_' + node, from: nodeID, to: node, arrows: "to" });
        } catch (err) { }
    });

    backwardInfo[nodeID].forEach(function (node) {
        if (!nodes_state.has(node)) {
            nodes_state.set(node, "added");
            nodes.add({ id: node, label: node, level: clickedNode.level - 1 });
        }
        try {
            edges.add({ id: node + '_' + nodeID, from: nodeID, to: node, arrows: "from" });
        } catch (err) { }
    });

    highlightNode(clickedNode);
}


function delNodes(clickedNode) {
    nodeID = clickedNode.id;
    forwardInfo[nodeID].forEach(function (node) {
        if (nodes_state.has(node) && nodes_state.get(node) != "expanded") {
            if (network.getConnectedEdges(node).length === 1) {
                nodes_state.delete(node);
                nodes.remove({ id: node });
            }
            edges.remove({ id: nodeID + '_' + node });
        }
    });

    backwardInfo[nodeID].forEach(function (node) {
        if (nodes_state.has(node) && nodes_state.get(node) != "expanded") {
            if (network.getConnectedEdges(node).length === 1) {
                nodes_state.delete(node);
                nodes.remove({ id: node });
            }
            edges.remove({ id: node + '_' + nodeID });
        }
    });

    unHighlightNode(clickedNode);
}


function highlightNode(clickedNode) {
    clickedNode.color = {
        border: '#CD2626',
        background: '#FA8072',
        highlight: { border: '#CD2626', background: '#FBA69D' },
        hover: { border: '#CD2626', background: '#FBA69D' }
    }
    nodes.update(clickedNode);
}

function unHighlightNode(clickedNode) {
    clickedNode.color = {
        border: '#2B7CE9',
        background: '#97C2FC',
        highlight: { border: '#2B7CE9', background: '#D2E5FF' },
        hover: { border: '#2B7CE9', background: '#D2E5FF' },
    }
    nodes.update(clickedNode);
}
