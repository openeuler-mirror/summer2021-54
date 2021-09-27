// import html2canvas from 'html2canvas';

// create vis
var viz = new Viz();
nodes_state = new Map();
var dotTable;
var port;
var created = false
var struct_input

function downloadGraphViz() {
    if (!created) {
        alert("请先输入结构体")
        return
    }

    var link = document.createElement("a");
    link.download = struct_input + ".png";
    link.href = document.getElementById("graphviznetwork").lastChild.src;
    document.body.appendChild(link);
    link.click();
}


function createGraphViz() {
    // 清空之前内容
    nodes_state = new Map();
    var container = document.getElementById("graphviznetwork");
    container.innerHTML = ''
    created = false

    // 初始化
    struct_input = document.getElementById("struct_input2").value;
    nodes_state.set(struct_input, "center");
    var graph = `digraph structs { \n rankdir=LR \n node [shape=plaintext] \n struct `
    graph += genDot(struct_input)

    // forward
    forwardInfo[struct_input].forEach(function (node, index) {
        if (!nodes_state.has(node)) {
            nodes_state.set(node, "f" + index);
            graph += `struct_f${index} ` + genDot(node)
            info = getPort(struct_input, node)
            port = info[0]
            is_pointer = info[1]
            graph += `struct:pf${port} -> struct_f${index}:p${is_pointer ? ' [style=dashed]' : ''}; \n`
        } else {
            graph += `struct:p -> struct:p; \n`
        }
    });

    // backward
    backwardInfo[struct_input].forEach(function (node, index) {
        if (!nodes_state.has(node)) {
            nodes_state.set(node, "b" + index);
            graph += `struct_b${index} ` + genDot(node)
            info = getPort(node, struct_input)
            port = info[0]
            is_pointer = info[1]
            graph += `struct_b${index}:pf${port} -> struct:p${is_pointer ? ' [style=dashed]' : ''}; \n`
        } else if (nodes_state.get(node) != "center") {
            info = getPort(node, struct_input)
            port = info[0]
            is_pointer = info[1]
            graph += `struct_${nodes_state.get(node)}:pf${port} -> struct:p${is_pointer ? ' [style=dashed]' : ''}; \n`
        }
    });

    graph += `}`

    viz.renderImageElement(graph)
        .then(function (element) {
            container.appendChild(element);
        })
        .catch(error => {
            // Create a new Viz instance (@see Caveats page for more info)
            viz = new Viz();
            // Possibly display the error
            console.error(error);
        });

    created = true
}




function genDot(struct) {
    dotTable = `[label=< 
        <TABLE BORDER="0" CELLBORDER="1" CELLPADDING="4" CELLSPACING="0" >
        <TR><TD BALIGN="CENTER" COLSPAN="2" PORT="p"><B> ${struct} </B></TD></TR> \n`

    if (detailInfo[struct] != undefined) {
        Object.keys(detailInfo[struct]).forEach(function (member, index) {
            dotTable += `<TR><TD PORT="pb${index}"> ${detailInfo[struct][member]} </TD><TD PORT="pf${index}"> ${member} </TD></TR> \n`
        })
    }
    dotTable += `</TABLE>>]; \n`
    return dotTable
}

function getPort(struct, node) {
    port = ''
    is_pointer = false
    try {
        Object.keys(detailInfo[struct]).forEach(function (member, index) {
            if (detailInfo[struct][member] == node) {
                port = index
                is_pointer = (member.charAt(member.length - 1) == '*')
                throw new Error()
            }
        })
    } catch (e) { }

    return [port, is_pointer]
}
