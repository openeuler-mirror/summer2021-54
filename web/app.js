var init_level = 5;
nodes_state = new Map();

// create vis
var nodes = new vis.DataSet(new Array())
var edges = new vis.DataSet(new Array())

// create a network
var container = document.getElementById("mynetwork");
var data = { nodes: nodes, edges: edges };
// var options = {};
var options = {
    interaction: { hover: true },
    layout: { hierarchical: { direction: 'UD', sortMethod: 'hubsize' } },
    //上下级结构显示,当定义上下级时候需要自定义层级显示时，需要对所有节点进行level属性进行定义    
};
var network = new vis.Network(container, data, options);

function formSubmit() {
    var struct = document.getElementById("struct_input").value;

    nodes.add({ id: struct, label: struct, level: init_level, count: 0 })
    nodes_state.set(struct, "expanded");
    console.log(nodes.get(struct))
    addNodes(nodes.get(struct));


    network.on("doubleClick", function (params) { //双击事件
        if (params.nodes.length === 0) { return; } //排除非节点双击事件

        var nodeID = params.nodes[0];
        var clickedNode = nodes.get(nodeID);

        if (nodes_state.get(nodeID) === "expanded") { //已展开的结点
            nodes_state.set(nodeID, "added");
            delNodes(clickedNode);
            return;
        }

        // 加入新展开结点的部分
        nodes_state.set(nodeID, "expanded")
        addNodes(clickedNode);
    });
}



function addNodes(clickedNode) {
    nodeID = clickedNode.id
    forwardInfo[nodeID].forEach(function (node) {
        if (!nodes_state.has(node)) {
            nodes_state.set(node, "added");
            nodes.add({ id: node, label: node, level: clickedNode.level + 1 })
        }
        try {
            edges.add({ id: nodeID + '_' + node, from: nodeID, to: node, arrows: "to" })
        } catch (err) { }
    });

    backwardInfo[nodeID].forEach(function (node) {
        if (!nodes_state.has(node)) {
            nodes_state.set(node, "added");
            nodes.add({ id: node, label: node, level: clickedNode.level - 1 })
        }
        try {
            edges.add({ id: node + '_' + nodeID, from: nodeID, to: node, arrows: "from" })
        } catch (err) { }
    });

    highlightNode(clickedNode);
}


function delNodes(clickedNode) {
    nodeID = clickedNode.id
    forwardInfo[nodeID].forEach(function (node) {
        if (nodes_state.has(node) && nodes_state.get(node) != "expanded") {
            if (network.getConnectedEdges(node).length === 1) {
                nodes_state.delete(node);
                nodes.remove({ id: node })
            }
            edges.remove({ id: nodeID + '_' + node })
        }
    });

    backwardInfo[nodeID].forEach(function (node) {
        if (nodes_state.has(node) && nodes_state.get(node) != "expanded") {
            if (network.getConnectedEdges(node).length === 1) {
                nodes_state.delete(node);
                nodes.remove({ id: node })
            }
            edges.remove({ id: node + '_' + nodeID })
        }
    });

    unHighlightNode(clickedNode);
}


function highlightNode(clickedNode) {
    clickedNode.color = {
        border: '#CD2626',
        background: '#FA8072',
        highlight: { border: '#2B7CE9', background: '#D2E5FF' }
    }
    nodes.update(clickedNode);
}

function unHighlightNode(clickedNode) {
    clickedNode.color = {
        border: '#2263e3',
        background: '#86b3fa',
        highlight: { border: '#2263e3', background: '#c8defe' }
    }
    nodes.update(clickedNode);
}


// TODO：增加屏蔽

// TODO 改节点颜色

// TODO 右边增加一个边框显示结点具体信息